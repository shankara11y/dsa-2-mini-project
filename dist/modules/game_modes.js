/**
 * Game Modes and Gamification Layer for PODIUM RUSH.
 * Handles Challenge Mode, Survival Mode, Achievements, and Local Leaderboards
 * using real-world Electronic Appliances (Laptop, Mobile, TV, etc.).
 */
import { sound } from './sound.js';
import { getMascot } from './mascots.js';

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
        this.survivalChampion = 'LAPTOP';
        this.survivalTimer = null;
        this.survivalDecayTimer = null;
        this.survivalSecondsLeft = 45;
        this.survivalScore = 0;

        // Achievements
        this.unlockedAchievements = JSON.parse(localStorage.getItem('podium_rush_achievements') || '[]');
        this.leaderboard = JSON.parse(localStorage.getItem('podium_rush_leaderboard') || '[]');

        this.achievementDefs = [
            { id: 'first_sale', title: 'First Sale!', desc: 'Sold your first electronic gadget.', icon: '⚡' },
            { id: 'leapfrog', title: 'Podium Surge!', desc: 'Overtook the leader to claim #1 Top Trending appliance.', icon: '👑' },
            { id: 'tie_breaker', title: 'Tie-Breaker!', desc: 'Won a podium spot via deterministic tie-break.', icon: '⚖️' },
            { id: 'heap_hero', title: 'Retail Titan!', desc: 'Processed 500 electronics sales in the arena.', icon: '🛡️' },
            { id: 'turbo_10k', title: 'Black Friday 10k!', desc: 'Handled 10,000 gadget sales at WASM speed.', icon: '🚀' },
            { id: 'scholar', title: 'DSA Scholar!', desc: 'Ran the Heap vs Sort benchmark.', icon: '📊' },
            { id: 'debunker', title: 'Mythbuster!', desc: 'Tested Why Standard Heaps Fail demo.', icon: '🔬' },
            { id: 'survival_survivor', title: 'Arena Champion!', desc: 'Protected your appliance on the podium for 45s.', icon: '🏆' }
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
        const appliances = ['LAPTOP', 'MOBILE', 'TV', 'HEADPHONES', 'SMARTWATCH', 'CONSOLE'];
        const streamLength = Math.floor(Math.random() * 20) + 25; // 25-45 sales
        this.challengeStream = [];

        // Generate semi-skewed stream
        for (let i = 0; i < streamLength; i++) {
            const r = Math.random();
            let p;
            if (r < 0.35) p = 'LAPTOP';
            else if (r < 0.60) p = 'MOBILE';
            else if (r < 0.80) p = 'TV';
            else if (r < 0.92) p = 'HEADPHONES';
            else p = appliances[Math.floor(Math.random() * appliances.length)];
            this.challengeStream.push(p);
        }

        this.challengePredictedId = null;
        this.renderChallengeUI();
    }

    renderChallengeUI() {
        const container = document.getElementById('game-mode-panel');
        if (!container) return;

        const appliances = ['LAPTOP', 'MOBILE', 'TV', 'HEADPHONES', 'SMARTWATCH', 'CONSOLE'];
        const options = appliances.map(id => {
            const mascot = getMascot(id);
            return `
                <button class="btn btn-outline challenge-pick-btn ${this.challengePredictedId === id ? 'selected' : ''}" data-id="${id}">
                    ${mascot.emoji} ${mascot.short}
                </button>
            `;
        }).join('');

        container.innerHTML = `
            <div class="game-card neon-card">
                <div class="game-card-header">
                    <h4>🎯 Challenge Mode: Predict the #1 Trending Appliance!</h4>
                    <span class="badge badge-accent">Streak: ${this.challengeStreak}</span>
                </div>
                <p class="game-desc">
                    A flash-sale queue of <strong>${this.challengeStream.length} electronic sales</strong> is incoming.
                    Predict which gadget will claim Rank #1 on the podium!
                </p>
                <div class="challenge-options-grid">${options}</div>
                <div class="game-actions">
                    <button id="start-challenge-btn" class="btn btn-primary" ${!this.challengePredictedId ? 'disabled' : ''}>
                        🚀 Lock In & Run Flash Stream
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

        this.app.resetArena(() => {
            const resultBanner = document.getElementById('challenge-result-banner');
            if (resultBanner) {
                resultBanner.className = 'challenge-result-banner running';
                resultBanner.innerHTML = '⚡ Replaying incoming gadget sales at 25 events/sec...';
            }

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
        const mascot = getMascot(winner.id);

        if (isCorrect) {
            this.challengeStreak++;
            this.challengeScore += 100 * this.challengeStreak;
            sound.playFanfare();
            resultBanner.className = 'challenge-result-banner win';
            resultBanner.innerHTML = `
                🎉 <strong>CORRECT!</strong> ${mascot.emoji} <strong>${mascot.name}</strong> claimed Rank #1 with ${winner.count} sales!<br>
                +${100 * this.challengeStreak} pts! Current Streak: ${this.challengeStreak}
            `;
            this.checkAchievement('heap_hero');
            this.addLeaderboardEntry('Challenge Mode', this.challengeScore);
        } else {
            this.challengeStreak = 0;
            sound.playError();
            resultBanner.className = 'challenge-result-banner lose';
            resultBanner.innerHTML = `
                ❌ <strong>CLOSE!</strong> You predicted ${this.challengePredictedId}, but ${mascot.emoji} ${mascot.name} took #1 (${winner.count} sales).
            `;
        }
    }

    // ============================================================
    // SURVIVAL MODE
    // ============================================================
    initSurvival() {
        this.survivalChampion = 'LAPTOP';
        this.survivalSecondsLeft = 45;
        this.survivalScore = 0;
        this.renderSurvivalUI();
    }

    renderSurvivalUI() {
        const container = document.getElementById('game-mode-panel');
        if (!container) return;

        const appliances = ['LAPTOP', 'MOBILE', 'TV', 'HEADPHONES'];
        const options = appliances.map(id => {
            const mascot = getMascot(id);
            return `
                <button class="btn btn-outline survival-champ-btn ${this.survivalChampion === id ? 'selected' : ''}" data-id="${id}">
                    ${mascot.emoji} ${mascot.short}
                </button>
            `;
        }).join('');

        const champMascot = getMascot(this.survivalChampion);

        container.innerHTML = `
            <div class="game-card neon-card">
                <div class="game-card-header">
                    <h4>🔥 Survival Mode: Defend Your Appliance on the Podium!</h4>
                    <span class="badge badge-warning">Time Left: <span id="survival-timer-display">${this.survivalSecondsLeft}s</span></span>
                </div>
                <p class="game-desc">
                    Competitors are relentlessly buying rival electronics!
                    Keep your <strong>${champMascot.emoji} ${champMascot.name}</strong> inside the Top ${this.app.currentK || 3} podium by clicking / pressing Spacebar rapidly!
                </p>
                <div class="survival-champ-select">
                    <label>Choose Your Device:</label>
                    <div class="btn-group">${options}</div>
                </div>
                <div class="game-actions">
                    <button id="start-survival-btn" class="btn btn-primary">
                        🛡️ Start Survival Match
                    </button>
                    <button id="boost-champ-btn" class="btn btn-accent btn-large hidden">
                        ⚡ Sell ${champMascot.emoji} ${champMascot.short}! (SPACEBAR)
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
            // Seed initial sales
            for (let i = 0; i < 5; i++) this.app.recordSale(this.survivalChampion);
            for (let i = 0; i < 4; i++) this.app.recordSale('MOBILE');
            for (let i = 0; i < 4; i++) this.app.recordSale('TV');

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
            const competitors = ['MOBILE', 'TV', 'HEADPHONES', 'SMARTWATCH', 'CONSOLE', 'DRONE'];
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
        const champMascot = getMascot(this.survivalChampion);

        if (boostBtn) boostBtn.classList.add('hidden');
        if (startBtn) startBtn.classList.remove('hidden');

        if (survived) {
            sound.playFanfare();
            this.checkAchievement('survival_survivor');
            this.addLeaderboardEntry('Survival Mode', this.survivalScore);
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="alert alert-success">
                        🏆 <strong>VICTORY!</strong> You kept ${champMascot.emoji} ${champMascot.name} on the podium for the full 45s!
                        Final Score: ${this.survivalScore} pts!
                    </div>
                `;
            }
        } else {
            sound.playError();
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="alert alert-danger">
                        💀 <strong>KNOCKED OFF PODIUM!</strong> ${champMascot.emoji} ${champMascot.short} fell out of the Top-K.
                        Survived: ${45 - this.survivalSecondsLeft}s. Try again!
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

        setTimeout(() => toast.classList.add('show'), 50);
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
