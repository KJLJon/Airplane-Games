/* =============================================================
   game.js — Main game loop, input, camera, orchestration
   All engine + UI modules are loaded before this file.
   ============================================================= */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* ── Camera ──────────────────────────────────────────────── */
let cameraX   = 0;  // world X of left edge of screen
const VEHICLE_SCREEN_X = 0.28;  // vehicle drawn at 28% from left

/* Base Y for tunnel (floor baseline at canvas 55%) */
function baseY() { return canvas.height * 0.55; }

/* ── Game state ──────────────────────────────────────────── */
let gameActive = false, gamePaused = false;
let animId     = null, frameCount = 0;
let lastZoneIdx = -1;

/* ── Input ───────────────────────────────────────────────── */
let pressing = false;

function onPress() {
  if (!gameActive || gamePaused) return;
  pressing = true; sim.accelerating = true;
  ensureAudio();
  // Double-tap detection for reverseGravity
  const now = Date.now();
  if (getUpg('reverseGravity') && now - sim.lastTapTime < 300) {
    sim.gravFlipFrames = 120;
  }
  sim.lastTapTime = now;
}
function onRelease() {
  pressing = false;
  sim.accelerating = false;
}

canvas.addEventListener('touchstart', e => { e.preventDefault(); onPress(); }, { passive: false });
canvas.addEventListener('touchend',   e => { e.preventDefault(); onRelease(); }, { passive: false });
canvas.addEventListener('touchcancel', () => onRelease());
canvas.addEventListener('mousedown',  () => onPress());
canvas.addEventListener('mouseup',    () => onRelease());
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); if (!pressing) onPress(); }
  if (e.code === 'KeyT' && hasTurbo()) activateTurbo();
});
document.addEventListener('keyup', e => {
  if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); onRelease(); }
});

/* ── Main game loop ──────────────────────────────────────── */
function gameLoop() {
  if (!gameActive || gamePaused) return;
  frameCount++;

  const vehicle = getSelectedVehicle();
  const bY      = baseY();

  // Determine zone
  const zone    = getZone(sim.distance);
  const zoneIdx = getZoneIndex(sim.distance);
  if (zoneIdx !== lastZoneIdx) {
    lastZoneIdx = zoneIdx;
    showZoneBadge(zone.name);
    sfxZone();
  }

  // Grow tunnel ahead
  growTunnel(cameraX, zone);

  // Physics step
  const crashed = physicsStep(vehicle, zone, bY, canvas);

  // Camera tracks vehicle
  cameraX = sim.x - canvas.width * VEHICLE_SCREEN_X;

  // Spawn + check collectibles
  spawnCollectibles(cameraX, bY, zone);
  checkCollectibles(cameraX, bY);

  // Particles
  const screenX = sim.x - cameraX;
  const screenY = sim.y - sim.suspY;
  spawnExhaustParticles(screenX, screenY, sim.accelerating, sim.heat);
  updateParticles();

  // Engine hum pitch
  updateEngineHum(sim.vx / 20, sim.accelerating);

  // HUD
  updateHUDText();
  updateGauges();

  // ── Render ──
  drawTunnel(ctx, cameraX, bY, zone);
  drawCollectibles(ctx, cameraX, bY, frameCount);
  drawParticles(ctx);
  drawTurboTrail(ctx, screenX, screenY);

  // Draw vehicle
  drawVehicle(ctx, vehicle, screenX, screenY, sim.tilt, sim.accelerating, sim.heat);
  drawShield(ctx, screenX, screenY, vehicle);

  // Gravity flip indicator
  if (sim.gravFlipFrames > 0) {
    ctx.save(); ctx.fillStyle = '#e040fb'; ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('↕ GRAVITY FLIP', canvas.width/2, 100);
    ctx.restore();
  }

  // Crash handling
  if (crashed) {
    spawnCrashParticles(screenX, screenY, vehicle);
    // Draw a few extra frames then show game over
    setTimeout(() => {
      stopEngineHum();
      showGameOver(sim.crashReason);
    }, 600);
    gameActive = false;
    return;
  }

  animId = requestAnimationFrame(gameLoop);
}

/* ── Start run ───────────────────────────────────────────── */
function startRun() {
  ensureAudio();
  gameActive = false;
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  gamePaused = false; pressing = false;

  applyAllUpgrades();

  const vehicle = getSelectedVehicle();
  const startX  = canvas.width * VEHICLE_SCREEN_X;

  // Reset tunnel
  const zone0 = getZone(0);
  buildTunnel(0, zone0);
  collectibles = []; nextCollWX = startX + 200;
  particles    = [];
  frameCount   = 0; lastZoneIdx = -1;

  resetSim(vehicle, startX);
  cameraX = 0;

  // Place vehicle on floor immediately
  sim.y = getFloorY(sim.x, baseY());
  sim.airborne = false; sim.grounded = true;

  showScreen(null);
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('gaugeWrap').classList.remove('hidden');

  gameActive = true;
  startMusic();
  startEngineHum(vehicle);
  animId = requestAnimationFrame(gameLoop);
}

/* ── Pause / Resume ──────────────────────────────────────── */
function pauseRun() {
  if (!gameActive || gamePaused) return;
  gamePaused = true;
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  stopMusic(); stopEngineHum();
  document.getElementById('pauseScreen').classList.remove('hidden');
}

function resumeRun() {
  if (!gameActive) return;
  gamePaused = false;
  document.getElementById('pauseScreen').classList.add('hidden');
  const vehicle = getSelectedVehicle();
  startMusic(); startEngineHum(vehicle);
  animId = requestAnimationFrame(gameLoop);
}

/* ── Init ────────────────────────────────────────────────── */
function init() {
  musicVol = saveData.settings.musicVol / 100;
  sfxVol   = saveData.settings.sfxVol   / 100;
  document.getElementById('musicVol').value = saveData.settings.musicVol;
  document.getElementById('sfxVol').value   = saveData.settings.sfxVol;

  applyAllUpgrades();
  wireMenuButtons();
  refreshStartStats();

  // Draw first frame background
  const zone0 = getZone(0);
  buildTunnel(0, zone0);
  drawTunnel(ctx, 0, baseY(), zone0);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
