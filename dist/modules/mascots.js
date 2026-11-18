/**
 * Electronic Appliances Mascot Database and Styling Generator for PODIUM RUSH.
 * Provides rich neon palettes, real-world appliance icons, and gadget branding.
 */

const PRESET_APPLIANCES = {
    'LAPTOP': { name: 'Ultra Laptop', short: 'Laptop', emoji: '💻', color: '#00f5ff', bg: 'linear-gradient(135deg, #00c6ff, #0072ff)', glow: 'rgba(0, 245, 255, 0.65)' },
    'MOBILE': { name: 'Pro Smartphone', short: 'Mobile', emoji: '📱', color: '#ff007f', bg: 'linear-gradient(135deg, #ff0844, #ffb199)', glow: 'rgba(255, 0, 127, 0.65)' },
    'TV': { name: '4K OLED Smart TV', short: 'Smart TV', emoji: '📺', color: '#ffd700', bg: 'linear-gradient(135deg, #f9d423, #ff4e50)', glow: 'rgba(255, 215, 0, 0.65)' },
    'HEADPHONES': { name: 'ANC Headphones', short: 'Headphones', emoji: '🎧', color: '#a855f7', bg: 'linear-gradient(135deg, #a855f7, #6366f1)', glow: 'rgba(168, 85, 247, 0.65)' },
    'SMARTWATCH': { name: 'Ultra Smartwatch', short: 'Watch', emoji: '⌚', color: '#00ff87', bg: 'linear-gradient(135deg, #00ff87, #60efff)', glow: 'rgba(0, 255, 135, 0.65)' },
    'TABLET': { name: 'Pro Tablet', short: 'Tablet', emoji: '📟', color: '#38bdf8', bg: 'linear-gradient(135deg, #38bdf8, #3b82f6)', glow: 'rgba(56, 189, 248, 0.65)' },
    'CONSOLE': { name: 'Next-Gen Console', short: 'Console', emoji: '🎮', color: '#ff5e62', bg: 'linear-gradient(135deg, #ff9966, #ff5e62)', glow: 'rgba(255, 94, 98, 0.65)' },
    'CAMERA': { name: '4K Mirrorless Camera', short: 'Camera', emoji: '📷', color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.65)' },
    'DRONE': { name: 'Aerial 4K Drone', short: 'Drone', emoji: '🛸', color: '#ec4899', bg: 'linear-gradient(135deg, #ec4899, #8b5cf6)', glow: 'rgba(236, 72, 153, 0.65)' },
    'VR_HEADSET': { name: 'VR Spatial Headset', short: 'VR Headset', emoji: '🥽', color: '#14b8a6', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', glow: 'rgba(20, 184, 166, 0.65)' },
    'SPEAKER': { name: 'Hi-Fi Smart Speaker', short: 'Speaker', emoji: '🔊', color: '#f97316', bg: 'linear-gradient(135deg, #ff8008, #ffc837)', glow: 'rgba(249, 115, 22, 0.65)' },
    'ROBOT_VAC': { name: 'AI Robot Vacuum', short: 'Robot Vac', emoji: '🤖', color: '#6366f1', bg: 'linear-gradient(135deg, #667eea, #764ba2)', glow: 'rgba(99, 102, 241, 0.65)' },

    // Additional Household Appliances
    'REFRIGERATOR': { name: 'Smart Refrigerator', short: 'Fridge', emoji: '🧊', color: '#0284c7', bg: 'linear-gradient(135deg, #0284c7, #38bdf8)', glow: 'rgba(2, 132, 199, 0.65)' },
    'MICROWAVE': { name: 'Inverter Microwave', short: 'Microwave', emoji: '📻', color: '#d946ef', bg: 'linear-gradient(135deg, #d946ef, #f43f5e)', glow: 'rgba(217, 70, 239, 0.65)' },
    'WASHING_MACHINE': { name: 'Steam Washer', short: 'Washer', emoji: '🫧', color: '#06b6d4', bg: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', glow: 'rgba(6, 182, 212, 0.65)' },
    'AC': { name: 'Dual Inverter AC', short: 'Air Cond.', emoji: '❄️', color: '#22c55e', bg: 'linear-gradient(135deg, #22c55e, #10b981)', glow: 'rgba(34, 197, 94, 0.65)' },

    // Backward compatibility mappings for letters A-Z
    'A': { name: 'Ultra Laptop', short: 'Laptop (A)', emoji: '💻', color: '#00f5ff', bg: 'linear-gradient(135deg, #00c6ff, #0072ff)', glow: 'rgba(0, 245, 255, 0.65)' },
    'B': { name: 'Pro Smartphone', short: 'Mobile (B)', emoji: '📱', color: '#ff007f', bg: 'linear-gradient(135deg, #ff0844, #ffb199)', glow: 'rgba(255, 0, 127, 0.65)' },
    'C': { name: '4K OLED Smart TV', short: 'Smart TV (C)', emoji: '📺', color: '#ffd700', bg: 'linear-gradient(135deg, #f9d423, #ff4e50)', glow: 'rgba(255, 215, 0, 0.65)' },
    'D': { name: 'Next-Gen Console', short: 'Console (D)', emoji: '🎮', color: '#ff5e62', bg: 'linear-gradient(135deg, #ff9966, #ff5e62)', glow: 'rgba(255, 94, 98, 0.65)' }
};

const DYNAMIC_EMOJIS = ['⚡', '🔌', '💡', '🔋', '📡', '🖨️', '🖥️', '⌨️', '🖱️', '🎙️', '🕹️', '📟'];

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
    if (PRESET_APPLIANCES[key]) {
        return PRESET_APPLIANCES[key];
    }

    const hash = hashString(key || 'DEVICE');
    const hue1 = hash % 360;
    const hue2 = (hue1 + 45) % 360;
    const emoji = DYNAMIC_EMOJIS[hash % DYNAMIC_EMOJIS.length];

    return {
        name: key,
        short: key,
        emoji: emoji,
        color: `hsl(${hue1}, 95%, 60%)`,
        bg: `linear-gradient(135deg, hsl(${hue1}, 85%, 55%), hsl(${hue2}, 85%, 45%))`,
        glow: `hsla(${hue1}, 95%, 60%, 0.65)`
    };
}

export const APPLIANCE_LIST = [
    { id: 'LAPTOP', label: 'Laptop', keyNum: 1 },
    { id: 'MOBILE', label: 'Mobile', keyNum: 2 },
    { id: 'TV', label: 'Smart TV', keyNum: 3 },
    { id: 'HEADPHONES', label: 'Headphones', keyNum: 4 },
    { id: 'SMARTWATCH', label: 'Smartwatch', keyNum: 5 },
    { id: 'TABLET', label: 'Tablet', keyNum: 6 },
    { id: 'CONSOLE', label: 'Console', keyNum: 7 },
    { id: 'CAMERA', label: 'Camera', keyNum: 8 },
    { id: 'DRONE', label: 'Drone', keyNum: 9 },
    { id: 'VR_HEADSET', label: 'VR Headset', keyNum: null },
    { id: 'SPEAKER', label: 'Speaker', keyNum: null },
    { id: 'ROBOT_VAC', label: 'Robot Vac', keyNum: null }
];
