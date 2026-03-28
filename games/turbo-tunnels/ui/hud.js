/* =============================================================
   ui/hud.js — HUD updates, gauge rendering, particle system
   ============================================================= */

/* ── Gauge DOM updates ─────────────────────────────────── */
function updateGauges() {
  const heatPct = sim.heat * 100;
  const fuelPct = (sim.fuel / PHYS.FUEL_MAX) * 100;
  const hf = document.getElementById('heatFill');
  const ff = document.getElementById('fuelFill');
  hf.style.width = heatPct + '%';
  ff.style.width = fuelPct + '%';
  hf.classList.toggle('danger', heatPct > 75);
  ff.classList.toggle('danger', fuelPct < 20);
}

function updateHUDText() {
  document.getElementById('hudDist').textContent   = sim.distance + 'm';
  document.getElementById('hudCoins').textContent  = '🪙 ' + sim.coinsRun;
  const v = getSelectedVehicle();
  document.getElementById('hudVehicle').textContent = v.icon + ' ' + v.name;
}

/* ── Zone badge ──────────────────────────────────────────── */
let zoneBadgeTimer = null;
function showZoneBadge(name) {
  const el = document.getElementById('zoneBadge');
  el.textContent = name;
  el.style.opacity = '1';
  clearTimeout(zoneBadgeTimer);
  zoneBadgeTimer = setTimeout(() => { el.style.opacity = '0'; }, 2200);
}

/* ── Particle system ─────────────────────────────────────── */
let particles = [];

function spawnExhaustParticles(screenX, screenY, accelerating, heat) {
  if (Math.random() > 0.6) return;
  const col = sim.turboFrames > 0 ? '#ff6d00' : (heat > 0.7 ? '#ff1744' : 'rgba(200,200,200,0.7)');
  const count = accelerating ? 2 : 1;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: screenX - 20, y: screenY - 8 + Math.random() * 6,
      vx: -1.5 - Math.random() * 2.5,
      vy: -0.5 + Math.random() * 1,
      r : 3 + Math.random() * 3,
      color: col, life: 1, decay: 0.05 + Math.random() * 0.05,
    });
  }
}

function spawnCrashParticles(screenX, screenY, vehicle) {
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 3 + Math.random() * 6;
    particles.push({
      x: screenX, y: screenY,
      vx: Math.cos(a)*s, vy: Math.sin(a)*s - 3,
      r: 4 + Math.random() * 5,
      color: [vehicle.color, '#ff6d00', '#ff1744', '#ffd740'][Math.floor(Math.random()*4)],
      life: 1, decay: 0.025 + Math.random() * 0.03,
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= p.decay; p.r = Math.max(0.5, p.r * 0.98); });
}

function drawParticles(ctx) {
  ctx.save();
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life * 0.9);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ── Shield ring (around vehicle when active) ─────────── */
function drawShield(ctx, screenX, screenY, vehicle) {
  if (sim.shieldFrames <= 0) return;
  const alpha = Math.min(1, sim.shieldFrames / 20);
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = '#64ffda'; ctx.lineWidth = 3;
  ctx.shadowColor = '#64ffda'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(screenX, screenY, vehicle.w * 0.8, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

/* ── Turbo trail (when active) ────────────────────────── */
function drawTurboTrail(ctx, screenX, screenY) {
  if (sim.turboFrames <= 0) return;
  const alpha = Math.min(1, sim.turboFrames / 15) * 0.6;
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(screenX, screenY, screenX - 80, screenY);
  grad.addColorStop(0, '#ff6d00'); grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(screenX - 40, screenY - 5, 42, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
