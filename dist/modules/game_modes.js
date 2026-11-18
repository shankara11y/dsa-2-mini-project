/**
 * Game Modes and Gamification Layer for PODIUM RUSH.
 * Handles Challenge Mode, Survival Mode, Achievements, and Local Leaderboards.
 */
import { sound } from './sound.js';

export class GameModes {
    constructor(app) {
        this.app = app;
        this.activeMode = 'sandbox'; // 'sandbox', 'challenge', 'survival'

        // Challenge Mode State
        this.challengeTarget = null;
        this.challengeStream = [];
        this.challengePredictedId = null;
        this.challengeScore = 0;
        this.challengeStreak = 0;

        // Survival Mode State
        this.survivalChampion = null;
        this.survivalTimer = null;
        this.survivalDecayTimer = null;
        this.survivalSecondsLeft = 45;
        this.survivalScore = 0;

        // Achievements
        this.unlockedAchievements = JSON.parse(localStorage.getItem('podium_rush_achievements') || '[]');
        this.leaderboard = JSON.parse(localStorage.getItem('podium_rush_leaderboard') || '[]');

        this.achievementDefs = [
            { id: 'first_sale', title: 'First Sale!', desc: 'The marketplace arena awakens.', icon: '⚡' },
            { id: 'leapfrog', title: 'Leapfrog Master!', desc: 'Overtook the leader to claim 1st place.', icon: '👑' },
            { id: 'tie_breaker', title: 'Tie-Breaker!', desc: 'Won a podium spot via alphabetical tie-break.', icon: '⚖️' },
            { id: 'heap_hero', title: 'Heap Hero!', desc: 'Processed 500 sales in the arena.', icon: '🛡️' },
            { id: 'turbo_10k', title: 'Turbo 10,000!', desc: 'Handled 10,000 sales at WASM speed.', icon: '🚀' },
            { id: 'scholar', title: 'DSA Scholar!', desc: 'Ran the Heap vs Sort benchmark.', icon: '📊' },
            { id: 'debunker', title: 'Mythbuster!', desc: 'Tested Why Standard Heaps Fail demo.', icon: '🔬' },
            { id: 'survival_survivor', title: 'Arena Champion!', desc: 'Survive 45 seconds in Survival Mode.', icon: '🏆' }
        ];
    }

    setMode(mode) {
        this.activeMode = mode;
        this.stopSurvival();
        if (mode === 'challenge') {
            this.initChallenge();
        } else if (mode === 'survival') {
            this.initSurvival();
        }
    }

    // ============================================================
    // CHALLENGE MODE
    // ============================================================
    initChallenge() {
        const products = ['A', 'B', 'C', 'D', 'E', 'F'];
        const streamLength = Math.floor(Math.random() * 20) + 25; // 25-45 sales
        this.challengeStream = [];

        // Generate semi-skewed stream
        for (let i = 0; i < streamLength; i++) {
            const r = Math.random();
            let p;
            if (r < 0.35) p = 'A';
            else if (r < 0.60) p = 'B';
            else if (r < 0.80) p = 'C';
            else if (r < 0.92) p = 'D';
            else p = products[Math.floor(Math.random() * products.length)];
            this.challengeStream.push(p);
        }

        this.challengePredictedId = null;
        this.renderChallengeUI();
    }

    renderChallengeUI() {
        const container = document.getElementById('game-mode-panel');
        if (!container) return;

        const options = ['A', 'B', 'C', 'D', 'E', 'F'].map(id => `
            <button class="btn btn-outline challenge-pick-btn ${this.challengePredictedId === id ? 'selected' : ''}" data-id="${id}">
                Predict ${id}
            </button>
        `).join('');

        container.innerHTML = `
            <div class="game-card neon-card">
                <div class="game-card-header">
                    <h4>🎯 Challenge Mode: Predict the Top-1 Winner!</h4>
                    <span class="badge badge-accent">Streak: ${this.challengeStreak}</span>
                </div>
                <p class="game-desc">
                    A hidden stream of <strong>${this.challengeStream.length} sales</strong> is queued.
                    Predict which product will reach Rank #1 before the replay finishes!
                </p>
                <div class="challenge-options-grid">${options}</div>
                <div class="game-actions">
                    <button id="start-challenge-btn" class="btn btn-primary" ${!this.challengePredictedId ? 'disabled' : ''}>
                        🚀 Lock In & Run Stream
                    </button>
                </div>
                <div id="challenge-result-banner" class="challenge-result-banner hidden"></div>
            </div>
        `;

        container.querySelectorAll('.challenge-pick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.challengePredictedId = e.currentTarget.getAttribute('data-id');
                this.renderChallengeUI();
            });
        });

        const startBtn = document.getElementById('start-challenge-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.runChallenge());
        }
    }

    runChallenge() {
        if (!this.challengePredictedId) return;

        // Reset arena tracker first
        this.app.resetArena(() => {
            const resultBanner = document.getElementById('challenge-result-banner');
            if (resultBanner) {
                resultBanner.className = 'challenge-result-banner running';
                resultBanner.innerHTML = '⚡ Replaying challenge stream at 25 events/sec...';
            }

            // Stream items step-by-step
            let idx = 0;
            const timer = setInterval(() => {
                if (idx < this.challengeStream.length) {
                    this.app.recordSale(this.challengeStream[idx]);
                    idx++;
                } else {
                    clearInterval(timer);
                    this.evaluateChallenge();
                }
            }, 40);
        });
    }

    evaluateChallenge() {
        const topK = this.app.currentTopK;
        const winner = topK.length > 0 ? topK[0] : null;
        const resultBanner = document.getElementById('challenge-result-banner');

        if (!winner || !resultBanner) return;

        const isCorrect = winner.id === this.challengePredictedId;

        if (isCorrect) {
            this.challengeStreak++;
            this.challengeScore += 100 * this.challengeStreak;
            sound.playFanfare();
            resultBanner.className = 'challenge-result-banner win';
            resultBanner.innerHTML = `
                🎉 <strong>CORRECT!</strong> ${winner.id} finished Rank #1 with ${winner.count} sales!<br>
                +${100 * this.challengeStreak} pts! Current Streak: ${this.challengeStreak}
            `;
            this.checkAchievement('heap_hero');
            this.addLeaderboardEntry('Challenge Mode', this.challengeScore);
        } else {
            this.challengeStreak = 0;
            sound.playError();
            resultBanner.className = 'challenge-result-banner lose';
            resultBanner.innerHTML = `
                ❌ <strong>CLOSE!</strong> You picked ${this.challengePredictedId}, but ${winner.id} won Rank #1 (${winner.count} sales).
            `;
        }
    }

    // ============================================================
    // SURVIVAL MODE
    // ============================================================
    initSurvival() {
        this.survivalChampion = 'A';
        this.survivalSecondsLeft = 45;
        this.survivalScore = 0;
        this.renderSurvivalUI();
    }

    renderSurvivalUI() {
        const container = document.getElementById('game-mode-panel');
        if (!container) return;

        const options = ['A', 'B', 'C', 'D'].map(id => `
            <button class="btn btn-outline survival-champ-btn ${this.survivalChampion === id ? 'selected' : ''}" data-id="${id}">
                ${id}
            </button>
        `).join('');

        container.innerHTML = `
            <div class="game-card neon-card">
                <div class="game-card-header">
                    <h4>🔥 Survival Mode: Protect Your Podium Spot!</h4>
                    <span class="badge badge-warning">Time Left: <span id="survival-timer-display">${this.survivalSecondsLeft}s</span></span>
                </div>
                <p class="game-desc">
                    Competitors are relentlessly buying other products!
                    Keep your Champion <strong>Agent ${this.survivalChampion}</strong> inside the Top ${this.app.currentK || 3} podium by clicking rapidly!
                </p>
                <div class="survival-champ-select">
                    <label>Choose Champion:</label>
                    <div class="btn-group">${options}</div>
                </div>
                <div class="game-actions">
                    <button id="start-survival-btn" class="btn btn-primary">
                        🛡️ Start Survival Match
                    </button>
                    <button id="boost-champ-btn" class="btn btn-accent btn-large hidden">
                        ⚡ Sell for Agent ${this.survivalChampion}! (SPACEBAR)
                    </button>
                </div>
                <div id="survival-status" class="survival-status"></div>
            </div>
        `;

        container.querySelectorAll('.survival-champ-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.survivalChampion = e.currentTarget.getAttribute('data-id');
                this.renderSurvivalUI();
            });
        });

        const startBtn = document.getElementById('start-survival-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startSurvival());
        }
    }

    startSurvival() {
        const startBtn = document.getElementById('start-survival-btn');
        const boostBtn = document.getElementById('boost-champ-btn');
        if (startBtn) startBtn.classList.add('hidden');
        if (boostBtn) boostBtn.classList.remove('hidden');

        this.app.resetArena(() => {
            // Give champion initial seed sales
            for (let i = 0; i < 5; i++) this.app.recordSale(this.survivalChampion);
            // Give competitors sales
            for (let i = 0; i < 4; i++) this.app.recordSale('B');
            for (let i = 0; i < 4; i++) this.app.recordSale('C');

            this.survivalSecondsLeft = 45;
            this.survivalScore = 0;

            const timerDisplay = document.getElementById('survival-timer-display');
            const statusEl = document.getElementById('survival-status');

            // Countdown timer
            this.survivalTimer = setInterval(() => {
                this.survivalSecondsLeft--;
                if (timerDisplay) timerDisplay.innerText = `${this.survivalSecondsLeft}s`;

                // Check if champion is still in top-K
                const inTopK = this.app.currentTopK.some(p => p.id === this.survivalChampion);
                if (!inTopK) {
                    this.endSurvival(false);
                    return;
                }

                this.survivalScore += 10;

                if (this.survivalSecondsLeft <= 0) {
                    this.endSurvival(true);
                }
            }, 1000);

            // Competitor incoming attack stream
            const competitors = ['B', 'C', 'D', 'E', 'F'];
            this.survivalDecayTimer = setInterval(() => {
                const target = competitors[Math.floor(Math.random() * competitors.length)];
                this.app.recordSale(target);
            }, 180);

            boostBtn.onclick = () => {
                this.app.recordSale(this.survivalChampion);
                sound.playTick();
            };
        });
    }

    endSurvival(survived) {
        this.stopSurvival();
        const boostBtn = document.getElementById('boost-champ-btn');
        const startBtn = document.getElementById('start-survival-btn');
        const statusEl = document.getElementById('survival-status');

        if (boostBtn) boostBtn.classList.add('hidden');
        if (startBtn) startBtn.classList.remove('hidden');

        if (survived) {
            sound.playFanfare();
            this.checkAchievement('survival_survivor');
            this.addLeaderboardEntry('Survival Mode', this.survivalScore);
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="alert alert-success">
                        🏆 <strong>VICTORY!</strong> You protected Agent ${this.survivalChampion} for the full 45s!
                        Score: ${this.survivalScore} pts!
                    </div>
                `;
            }
        } else {
            sound.playError();
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="alert alert-danger">
                        💀 <strong>KNOCKED OFF PODIUM!</strong> Agent ${this.survivalChampion} fell out of the Top-K.
                        Survival Time: ${45 - this.survivalSecondsLeft}s. Try again!
                    </div>
                `;
            }
        }
    }

    stopSurvival() {
        if (this.survivalTimer) {
            clearInterval(this.survivalTimer);
            this.survivalTimer = null;
        }
        if (this.survivalDecayTimer) {
            clearInterval(this.survivalDecayTimer);
            this.survivalDecayTimer = null;
        }
    }

    // ============================================================
    // ACHIEVEMENTS & LEADERBOARD
    // ============================================================
    checkAchievement(id) {
        if (this.unlockedAchievements.includes(id)) return;

        const ach = this.achievementDefs.find(a => a.id === id);
        if (!ach) return;

        this.unlockedAchievements.push(id);
        localStorage.setItem('podium_rush_achievements', JSON.stringify(this.unlockedAchievements));

        sound.playAchievement();
        this.showAchievementToast(ach);
    }

    showAchievementToast(ach) {
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="toast-icon">${ach.icon}</div>
            <div class="toast-body">
                <div class="toast-title">Achievement Unlocked!</div>
                <div class="toast-name">${ach.title}</div>
                <div class="toast-desc">${ach.desc}</div>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 50);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    addLeaderboardEntry(mode, score) {
        const entry = {
            mode,
            score,
            date: new Date().toLocaleDateString()
        };
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
        localStorage.setItem('podium_rush_leaderboard', JSON.stringify(this.leaderboard));
    }
}

