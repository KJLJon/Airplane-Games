/* =============================================================
   engine/zones.js — Zone definitions and zone-based modifiers
   ============================================================= */

const ZONES = [
  {
    id: 'mines', name: '⛏️ Rusty Mines',
    distStart: 0,
    hillAmp: 80, hillFreq: 0.016, loopChance: 0,
    gravityMult: 1.0, frictionMult: 1.0,
    bgTop: '#1a0a00', bgMid: '#3e1a00', bgBot: '#5d2d00',
    wallColor: '#6d4c41', ceilColor: '#4e342e',
    accentColor: '#ff6d00',
    hazard: null,
    collectibleMult: 1.0,
  },
  {
    id: 'crystals', name: '💎 Crystal Caverns',
    distStart: 1500,
    hillAmp: 100, hillFreq: 0.013, loopChance: 0.03,
    gravityMult: 0.9, frictionMult: 1.05,
    bgTop: '#000d2b', bgMid: '#001f5b', bgBot: '#003380',
    wallColor: '#1565c0', ceilColor: '#0d47a1',
    accentColor: '#64ffda',
    hazard: 'crystalSpikes',
    collectibleMult: 1.3,
  },
  {
    id: 'lava', name: '🌋 Lava Tubes',
    distStart: 3500,
    hillAmp: 90, hillFreq: 0.018, loopChance: 0.05,
    gravityMult: 1.1, frictionMult: 0.92,
    bgTop: '#1b0000', bgMid: '#4a0000', bgBot: '#7f0000',
    wallColor: '#b71c1c', ceilColor: '#880e4f',
    accentColor: '#ff1744',
    hazard: 'lavaGeyser',
    collectibleMult: 1.5,
  },
  {
    id: 'frozen', name: '❄️ Frozen Hollows',
    distStart: 6000,
    hillAmp: 120, hillFreq: 0.011, loopChance: 0.08,
    gravityMult: 0.85, frictionMult: 0.78,  // slippery!
    bgTop: '#001433', bgMid: '#002060', bgBot: '#003399',
    wallColor: '#80deea', ceilColor: '#4dd0e1',
    accentColor: '#e0f7fa',
    hazard: 'iceWind',
    collectibleMult: 1.8,
  },
  {
    id: 'reactor', name: '⚛️ Neon Reactor Core',
    distStart: 9500,
    hillAmp: 140, hillFreq: 0.009, loopChance: 0.14,
    gravityMult: 1.2, frictionMult: 0.88,
    bgTop: '#0a0020', bgMid: '#14003a', bgBot: '#200060',
    wallColor: '#7c4dff', ceilColor: '#651fff',
    accentColor: '#e040fb',
    hazard: 'gravityPocket',
    collectibleMult: 2.5,
  },
];

function getZone(dist) {
  let zone = ZONES[0];
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (dist >= ZONES[i].distStart) { zone = ZONES[i]; break; }
  }
  return zone;
}

function getZoneIndex(dist) {
  let idx = 0;
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (dist >= ZONES[i].distStart) { idx = i; break; }
  }
  return idx;
}

/* Zone-specific gravity modifier applied per frame */
function getEffectiveGravity(zone) {
  return PHYS.GRAVITY * zone.gravityMult;
}

/* Zone-specific friction modifier for ground contact */
function getEffectiveFriction(zone) {
  return PHYS.FRICTION * zone.frictionMult;
}
