/* =============================================================
   engine/upgrades.js — Upgrade definitions + effect application
   ============================================================= */

const UPGRADES = [
  /* ── Vehicle upgrades ──────────────────────────────────── */
  {
    id: 'enginePower', cat: 'Vehicle', name: 'Engine Power',
    desc: 'More torque, climb steeper hills faster',
    maxLevel: 5, costCoins: [40, 90, 180, 320, 550], costBP: [0, 0, 0, 1, 2],
    effect() { PHYS.TORQUE = 0.6 + getUpg('enginePower') * 0.12; },
  },
  {
    id: 'suspStrength', cat: 'Vehicle', name: 'Suspension Strength',
    desc: 'Absorbs bumps better, reduces bounce crashes',
    maxLevel: 5, costCoins: [35, 80, 160, 290, 500], costBP: [0, 0, 0, 1, 2],
    effect() { PHYS.SUSPENSION_K = 0.3 + getUpg('suspStrength') * 0.04; },
  },
  {
    id: 'tireGrip', cat: 'Vehicle', name: 'Tire Grip',
    desc: 'Better traction on slopes and slippery zones',
    maxLevel: 5, costCoins: [30, 70, 140, 250, 440], costBP: [0, 0, 0, 1, 1],
    effect() { PHYS.FRICTION = 0.92 + getUpg('tireGrip') * 0.012; },
  },
  {
    id: 'turboBoost', cat: 'Vehicle', name: 'Turbo Boost',
    desc: 'Extra burst when you start accelerating',
    maxLevel: 3, costCoins: [80, 180, 380], costBP: [0, 1, 2],
    effect() {},  // Applied on-demand via hasTurbo()
  },
  {
    id: 'fuelTank', cat: 'Vehicle', name: 'Fuel Tank',
    desc: 'Increases max fuel capacity',
    maxLevel: 5, costCoins: [40, 85, 170, 300, 520], costBP: [0, 0, 0, 1, 2],
    effect() { PHYS.FUEL_MAX = 100 + getUpg('fuelTank') * 20; },
  },
  {
    id: 'coolingSystem', cat: 'Vehicle', name: 'Cooling System',
    desc: 'Heat dissipates faster when not accelerating',
    maxLevel: 5, costCoins: [35, 75, 150, 270, 460], costBP: [0, 0, 0, 1, 2],
    effect() { PHYS.COOL_RATE = 0.3 + getUpg('coolingSystem') * 0.08; },
  },
  /* ── Utility upgrades ──────────────────────────────────── */
  {
    id: 'coinMagnet', cat: 'Utility', name: 'Coin Magnet',
    desc: 'Attract coins from further away',
    maxLevel: 4, costCoins: [50, 110, 220, 400], costBP: [0, 0, 1, 2],
    effect() {},
  },
  {
    id: 'shieldDuration', cat: 'Utility', name: 'Shield',
    desc: 'Brief invincibility after spawning or jump landing',
    maxLevel: 3, costCoins: [90, 200, 400], costBP: [1, 2, 3],
    effect() {},
  },
  {
    id: 'autoStabilizer', cat: 'Utility', name: 'Auto-Stabilizer',
    desc: 'Automatically corrects dangerous tilt angles',
    maxLevel: 3, costCoins: [70, 160, 320], costBP: [0, 1, 2],
    effect() {},
  },
  {
    id: 'overheatWarning', cat: 'Utility', name: 'Overheat Warning',
    desc: 'Visual flash when heat reaches 70%',
    maxLevel: 1, costCoins: [40], costBP: [0],
    effect() {},
  },
  /* ── Special abilities ─────────────────────────────────── */
  {
    id: 'doubleTurbo', cat: 'Special', name: 'Double Turbo',
    desc: 'Two turbo charges per run',
    maxLevel: 1, costCoins: [300], costBP: [3],
    effect() {},
  },
  {
    id: 'hoverWheels', cat: 'Special', name: 'Hover Wheels',
    desc: 'Briefly float over gaps',
    maxLevel: 1, costCoins: [400], costBP: [4],
    effect() {},
  },
  {
    id: 'wallRide', cat: 'Special', name: 'Wall Ride',
    desc: 'Stick to steep walls briefly',
    maxLevel: 1, costCoins: [350], costBP: [3],
    effect() {},
  },
  {
    id: 'reverseGravity', cat: 'Special', name: 'Reverse Gravity',
    desc: 'Flip gravity for 2 seconds (tap twice)',
    maxLevel: 1, costCoins: [500], costBP: [5],
    effect() {},
  },
];

/* Physics constants mutated by upgrade effects */
const PHYS = {
  TORQUE      : 0.6,
  FRICTION    : 0.92,
  SUSPENSION_K: 0.3,
  FUEL_MAX    : 100,
  COOL_RATE   : 0.3,
  GRAVITY     : 0.5,
  DRAG        : 0.995,
  HEAT_RATE   : 0.25,
};

function applyAllUpgrades() {
  // Reset to base values first, then apply each upgrade effect
  PHYS.TORQUE       = 0.6;
  PHYS.FRICTION     = 0.92;
  PHYS.SUSPENSION_K = 0.3;
  PHYS.FUEL_MAX     = 100;
  PHYS.COOL_RATE    = 0.3;
  UPGRADES.forEach(u => u.effect());
}

function getMagnetRadius() { return 35 + getUpg('coinMagnet') * 28; }
function getAutoStabStrength() { return getUpg('autoStabilizer') * 0.015; }
function hasTurbo()   { return getUpg('turboBoost') > 0; }
function hasHover()   { return getUpg('hoverWheels') > 0; }
function hasWallRide(){ return getUpg('wallRide') > 0; }
