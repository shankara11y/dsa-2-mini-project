/**
 * Mascot database and styling generator for PODIUM RUSH.
 * Provides rich neon palettes, avatars, and character names for products A-Z and arbitrary IDs.
 */

const PRESET_MASCOTS = {
    'A': { name: 'Aether Fox', emoji: '🦊', color: '#ff5e62', bg: 'linear-gradient(135deg, #ff9966, #ff5e62)', glow: 'rgba(255, 94, 98, 0.6)' },
    'B': { name: 'Byte Bot', emoji: '🤖', color: '#00f5ff', bg: 'linear-gradient(135deg, #00c6ff, #0072ff)', glow: 'rgba(0, 245, 255, 0.6)' },
    'C': { name: 'Cyber Cat', emoji: '🐱', color: '#ff007f', bg: 'linear-gradient(135deg, #ff0844, #ffb199)', glow: 'rgba(255, 0, 127, 0.6)' },
    'D': { name: 'Dragon Byte', emoji: '🐲', color: '#00ff87', bg: 'linear-gradient(135deg, #00ff87, #60efff)', glow: 'rgba(0, 255, 135, 0.6)' },
    'E': { name: 'Electro Owl', emoji: '🦉', color: '#ffd700', bg: 'linear-gradient(135deg, #f9d423, #ff4e50)', glow: 'rgba(255, 215, 0, 0.6)' },
    'F': { name: 'Flame Phoenix', emoji: '🔥', color: '#ff3d00', bg: 'linear-gradient(135deg, #f12711, #f5af19)', glow: 'rgba(255, 61, 0, 0.6)' },
    'G': { name: 'Giga Gorilla', emoji: '🦍', color: '#8e2de2', bg: 'linear-gradient(135deg, #8e2de2, #4a00e0)', glow: 'rgba(142, 45, 226, 0.6)' },
    'H': { name: 'Hyper Hawk', emoji: '🦅', color: '#00e5ff', bg: 'linear-gradient(135deg, #1fa2ff, #12d8fa)', glow: 'rgba(0, 229, 255, 0.6)' },
    'I': { name: 'Ion Iguana', emoji: '🦎', color: '#10b981', bg: 'linear-gradient(135deg, #11998e, #38ef7d)', glow: 'rgba(16, 185, 129, 0.6)' },
    'J': { name: 'Jolt Jellyfish', emoji: '🪼', color: '#ec4899', bg: 'linear-gradient(135deg, #ec4899, #8b5cf6)', glow: 'rgba(236, 72, 153, 0.6)' },
    'K': { name: 'Kraken King', emoji: '🐙', color: '#6366f1', bg: 'linear-gradient(135deg, #667eea, #764ba2)', glow: 'rgba(99, 102, 241, 0.6)' },
    'L': { name: 'Laser Lion', emoji: '🦁', color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.6)' },
    'M': { name: 'Matrix Monkey', emoji: '🐒', color: '#14b8a6', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', glow: 'rgba(20, 184, 166, 0.6)' },
    'N': { name: 'Nova Ninja', emoji: '🥷', color: '#a855f7', bg: 'linear-gradient(135deg, #a855f7, #6366f1)', glow: 'rgba(168, 85, 247, 0.6)' },
    'O': { name: 'Orbit Otter', emoji: '🦦', color: '#38bdf8', bg: 'linear-gradient(135deg, #38bdf8, #3b82f6)', glow: 'rgba(56, 189, 248, 0.6)' },
    'P': { name: 'Pixel Panda', emoji: '🐼', color: '#f43f5e', bg: 'linear-gradient(135deg, #ff758c, #ff7eb3)', glow: 'rgba(244, 63, 94, 0.6)' },
    'Q': { name: 'Quantum Quail', emoji: '🐦', color: '#eab308', bg: 'linear-gradient(135deg, #fce38a, #f38181)', glow: 'rgba(234, 179, 8, 0.6)' },
    'R': { name: 'Rocket Rhino', emoji: '🦏', color: '#ef4444', bg: 'linear-gradient(135deg, #ed213a, #93291e)', glow: 'rgba(239, 68, 68, 0.6)' },
    'S': { name: 'Solar Shark', emoji: '🦈', color: '#06b6d4', bg: 'linear-gradient(135deg, #2af598, #009efd)', glow: 'rgba(6, 182, 212, 0.6)' },
    'T': { name: 'Turbo Tiger', emoji: '🐯', color: '#f97316', bg: 'linear-gradient(135deg, #ff8008, #ffc837)', glow: 'rgba(249, 115, 22, 0.6)' },
    'U': { name: 'Ultra Unicorn', emoji: '🦄', color: '#d946ef', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', glow: 'rgba(217, 70, 239, 0.6)' },
    'V': { name: 'Vortex Viper', emoji: '🐍', color: '#22c55e', bg: 'linear-gradient(135deg, #0ba360, #3cba92)', glow: 'rgba(34, 197, 94, 0.6)' },
    'W': { name: 'Warp Wolf', emoji: '🐺', color: '#64748b', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', glow: 'rgba(100, 116, 139, 0.6)' },
    'X': { name: 'X-Ray Xenon', emoji: '🛸', color: '#3b82f6', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', glow: 'rgba(59, 130, 246, 0.6)' },
    'Y': { name: 'Yield Yeti', emoji: '🧊', color: '#0284c7', bg: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)', glow: 'rgba(2, 132, 199, 0.6)' },
    'Z': { name: 'Zenith Zebra', emoji: '🦓', color: '#e11d48', bg: 'linear-gradient(135deg, #f857a6, #ff5858)', glow: 'rgba(225, 29, 72, 0.6)' }
};

const DYNAMIC_EMOJIS = ['🚀', '⚡', '💎', '🎮', '🛸', '🔮', '🏆', '⭐', '🪐', '💫', '👾', '💥'];

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getMascot(id) {
    const key = (id || '').toUpperCase().trim();
    if (PRESET_MASCOTS[key]) {
        return PRESET_MASCOTS[key];
    }

    const hash = hashString(key || 'PROD');
    const hue1 = hash % 360;
    const hue2 = (hue1 + 45) % 360;
    const emoji = DYNAMIC_EMOJIS[hash % DYNAMIC_EMOJIS.length];

    return {
        name: `Agent ${key}`,
        emoji: emoji,
        color: `hsl(${hue1}, 95%, 60%)`,
        bg: `linear-gradient(135deg, hsl(${hue1}, 85%, 55%), hsl(${hue2}, 85%, 45%))`,
        glow: `hsla(${hue1}, 95%, 60%, 0.6)`
    };
}
