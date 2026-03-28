/* =============================================================
   engine/vehicle.js — Vehicle definitions and drawing
   ============================================================= */

const VEHICLES = [
  {
    id: 'buggy', name: 'Starter Buggy', icon: '🚗',
    unlockCost: 0, unlockBP: 0,
    stats: { speed: 2, grip: 3, suspension: 3, fuel: 3, cooling: 3 },
    desc: 'Balanced all-rounder',
    engineBaseFreq: 80,
    color: '#ff6d00', wheelColor: '#333', bodyColor: '#ff6d00',
    w: 46, h: 22, wheelR: 9,
    fuelDrain: 0.08, heatRate: 0.22,
  },
  {
    id: 'crawler', name: 'Rock Crawler', icon: '🚙',
    unlockCost: 150, unlockBP: 2,
    stats: { speed: 1, grip: 5, suspension: 5, fuel: 2, cooling: 3 },
    desc: 'Maximum grip on rough terrain',
    engineBaseFreq: 60,
    color: '#5d4037', wheelColor: '#212121', bodyColor: '#5d4037',
    w: 50, h: 26, wheelR: 11,
    fuelDrain: 0.12, heatRate: 0.15,
  },
  {
    id: 'hovercar', name: 'Hover Car', icon: '🛸',
    unlockCost: 300, unlockBP: 4,
    stats: { speed: 3, grip: 2, suspension: 5, fuel: 3, cooling: 4 },
    desc: 'Floats over rough patches',
    engineBaseFreq: 200,
    color: '#0288d1', wheelColor: '#e1f5fe', bodyColor: '#0288d1',
    w: 48, h: 18, wheelR: 7,
    fuelDrain: 0.10, heatRate: 0.18,
    hovering: true,
  },
  {
    id: 'jetbike', name: 'Jet-Wheel Bike', icon: '🏍️',
    unlockCost: 500, unlockBP: 6,
    stats: { speed: 5, grip: 2, suspension: 2, fuel: 2, cooling: 2 },
    desc: 'Blazing speed, expert handling',
    engineBaseFreq: 120,
    color: '#e53935', wheelColor: '#111', bodyColor: '#e53935',
    w: 40, h: 18, wheelR: 8,
    fuelDrain: 0.15, heatRate: 0.35,
  },
  {
    id: 'magrail', name: 'Mag-Rail Racer', icon: '🚄',
    unlockCost: 800, unlockBP: 10,
    stats: { speed: 4, grip: 4, suspension: 3, fuel: 4, cooling: 3 },
    desc: 'Magnetic traction, efficient engine',
    engineBaseFreq: 150,
    color: '#7c4dff', wheelColor: '#ede7f6', bodyColor: '#7c4dff',
    w: 52, h: 20, wheelR: 8,
    fuelDrain: 0.07, heatRate: 0.20,
  },
  {
    id: 'quantum', name: 'Quantum Drifter', icon: '🌀',
    unlockCost: 1500, unlockBP: 18,
    stats: { speed: 5, grip: 5, suspension: 5, fuel: 5, cooling: 5 },
    desc: 'Mastery vehicle — unlocks everything',
    engineBaseFreq: 180,
    color: '#e040fb', wheelColor: '#fff', bodyColor: '#e040fb',
    w: 46, h: 20, wheelR: 9,
    fuelDrain: 0.06, heatRate: 0.12,
  },
];

function getVehicle(id) { return VEHICLES.find(v => v.id === id) || VEHICLES[0]; }
function getSelectedVehicle() { return getVehicle(saveData.selectedVehicle); }

/* Draw vehicle on canvas at (cx, cy) with tilt angle */
function drawVehicle(ctx, vehicle, cx, cy, tilt, accelerating, heat) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);

  const { w, h, wheelR, color, wheelColor, bodyColor } = vehicle;
  const isHover = !!vehicle.hovering;

  // Heat glow overlay
  if (heat > 0.6) {
    ctx.shadowColor = `rgba(255,${Math.floor(100*(1-heat))},0,0.8)`;
    ctx.shadowBlur  = 12 + heat * 10;
  }

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.roundRect(-w/2, -h, w, h * 0.75, 5); ctx.fill();

  // Cockpit window
  ctx.fillStyle = 'rgba(160,220,255,0.7)';
  ctx.beginPath(); ctx.roundRect(-w*0.15, -h*0.95, w*0.4, h*0.45, 3); ctx.fill();

  // Exhaust flame when accelerating
  if (accelerating) {
    const flameLen = 10 + Math.random() * 14;
    ctx.fillStyle = heat > 0.7 ? '#ff1744' : '#ff6d00';
    ctx.beginPath();
    ctx.moveTo(-w/2, -h*0.35);
    ctx.lineTo(-w/2 - flameLen, -h*0.2 + Math.random()*4 - 2);
    ctx.lineTo(-w/2, -h*0.05);
    ctx.closePath(); ctx.fill();
  }

  // Wheels or hover ring
  if (!isHover) {
    [w*0.32, -w*0.28].forEach(xOff => {
      ctx.fillStyle = wheelColor;
      ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(xOff, 0, wheelR, 0, Math.PI*2); ctx.fill();
      // Rim
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(xOff, 0, wheelR * 0.55, 0, Math.PI*2); ctx.stroke();
    });
  } else {
    // Hover rings
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    [-w*0.26, w*0.26].forEach(xOff => {
      ctx.beginPath(); ctx.ellipse(xOff, wheelR*0.3, wheelR*1.1, wheelR*0.5, 0, 0, Math.PI*2); ctx.stroke();
    });
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}
