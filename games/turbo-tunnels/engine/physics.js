/* =============================================================
   engine/physics.js — Vehicle physics simulation
   Simple spring-suspension + wheel torque + heat/fuel model
   ============================================================= */

/* Simulation state — reset per run */
const sim = {
  // Position in world space
  x         : 0,   // worldX of vehicle centre
  y         : 0,   // screen Y of vehicle body (computed from suspension)
  // Velocity
  vx        : 0,
  vy        : 0,
  // Suspension (spring model)
  suspY     : 0,   // suspension offset (positive = compressed)
  suspVY    : 0,   // suspension velocity
  // Angle
  tilt      : 0,   // body tilt in radians
  // States
  grounded  : false,
  airborne  : false,
  // Systems
  heat      : 0,    // 0–1
  fuel      : 100,  // 0–FUEL_MAX
  // Crash state
  crashed   : false,
  crashReason: '',
  // Per-run stats
  distance  : 0,
  coinsRun  : 0,
  fuelCellsRun : 0,
  blueprintsRun: 0,
  // Boosts
  turboFrames    : 0,  // remaining frames of turbo
  turboCharges   : 0,  // charges available (1 or 2 with upgrade)
  shieldFrames   : 0,
  hoverFrames    : 0,
  gravFlipFrames : 0,
  // Input
  accelerating: false,
  // Double-tap for reverse gravity
  lastTapTime : 0,
};

function resetSim(vehicle, startX) {
  sim.x           = startX;
  sim.y           = 0;          // will be set in first physics step
  sim.vx          = 2;          // gentle start
  sim.vy          = 0;
  sim.suspY       = 0;
  sim.suspVY      = 0;
  sim.tilt        = 0;
  sim.grounded    = false;
  sim.airborne    = true;
  sim.heat        = 0;
  sim.fuel        = PHYS.FUEL_MAX;
  sim.crashed     = false;
  sim.crashReason = '';
  sim.distance    = 0;
  sim.coinsRun    = 0;
  sim.fuelCellsRun = 0;
  sim.blueprintsRun = 0;
  sim.turboFrames = 0;
  sim.turboCharges = 1 + (getUpg('doubleTurbo') > 0 ? 1 : 0);
  sim.shieldFrames = 0;
  sim.hoverFrames  = 0;
  sim.gravFlipFrames = 0;
  sim.accelerating = false;
}

/* ── Main physics step ─────────────────────────────────────
   Called every frame. baseY = canvas.height * 0.55 (floor baseline).
   Returns false if simulation continues, true if crash detected.
*/
function physicsStep(vehicle, zone, baseY, canvas) {
  if (sim.crashed) return true;

  const grav    = getEffectiveGravity(zone);
  const fric    = getEffectiveFriction(zone);
  const floorY  = getFloorY(sim.x, baseY);
  const ceilY   = getCeilY(sim.x, baseY);
  const slopeAng = getFloorAngle(sim.x, baseY);

  /* ── Turbo ─────────────────────────────────────────── */
  const turboActive = sim.turboFrames > 0;
  if (turboActive) sim.turboFrames--;

  /* ── Horizontal movement ───────────────────────────── */
  let accelForce = 0;
  if (sim.accelerating && sim.fuel > 0) {
    accelForce = PHYS.TORQUE * (turboActive ? 2.2 : 1);
    // Slope-adjusted torque: more torque going uphill
    accelForce += Math.sin(-slopeAng) * 0.3;
  }
  sim.vx += accelForce;
  sim.vx *= PHYS.DRAG;

  // Auto-stabilizer: nudge back toward flat
  const stabStr = getAutoStabStrength();
  if (stabStr > 0 && Math.abs(sim.tilt) > 0.15) {
    sim.tilt -= sim.tilt * stabStr;
  }

  // Clamp min speed (vehicle doesn't roll back completely)
  sim.vx = Math.max(0.5, Math.min(20, sim.vx));

  sim.x += sim.vx;

  /* ── Hover mode ────────────────────────────────────── */
  if (sim.hoverFrames > 0) { sim.hoverFrames--; }
  const hovering = vehicle.hovering || sim.hoverFrames > 0;

  /* ── Gravity flip ───────────────────────────────────── */
  const gravSign = sim.gravFlipFrames > 0 ? -1 : 1;
  if (sim.gravFlipFrames > 0) sim.gravFlipFrames--;

  /* ── Vertical & suspension ─────────────────────────── */
  if (hovering) {
    // Hover: float 30px above floor
    const targetY = floorY - 30;
    const springF  = (targetY - sim.y) * 0.18;
    sim.vy += springF;
    sim.vy *= 0.75;
    sim.y  += sim.vy;
    sim.grounded = false; sim.airborne = true;
    sim.tilt = slopeAng * 0.5;
  } else {
    sim.vy += grav * gravSign;

    // Gravity flip ceiling
    if (gravSign < 0 && sim.y < ceilY + vehicle.h) {
      sim.y  = ceilY + vehicle.h;
      sim.vy = Math.abs(sim.vy) * 0.4;
      sim.grounded = true;
    }

    sim.y += sim.vy;

    if (sim.y >= floorY) {
      /* Landing */
      const impactVy = sim.vy;
      sim.y        = floorY;
      sim.vy       = 0;
      sim.grounded = true;
      sim.airborne = false;

      // Hard landing crash if impact too severe
      if (impactVy > 18 && sim.shieldFrames === 0) {
        crash('Hard Landing!'); return true;
      }
      if (impactVy > 10) { sfxLand(); }

      // Suspension spring
      sim.suspY  += impactVy * 0.4;
      sim.suspVY  = -impactVy * 0.3;

      // Slope tilt
      sim.tilt = slopeAng;
      // Apply slope-based velocity boost on downhill, drag on uphill
      sim.vx += Math.sin(-slopeAng) * 0.5 * fric;
    } else {
      sim.grounded = false;
      sim.airborne = true;
    }
  }

  // Suspension damping
  sim.suspVY += -sim.suspY * PHYS.SUSPENSION_K;
  sim.suspVY *= 0.78;
  sim.suspY  += sim.suspVY;
  sim.suspY  = Math.max(-12, Math.min(12, sim.suspY));

  /* ── Ceiling crash ─────────────────────────────────── */
  if (!hovering && gravSign > 0 && sim.y - vehicle.h < ceilY) {
    if (sim.shieldFrames === 0) { crash('Hit the ceiling!'); return true; }
    else { sim.y = ceilY + vehicle.h; sim.vy = 2; }
  }

  /* ── Tilt crash threshold ───────────────────────────── */
  const maxTilt = 1.4 - getUpg('suspStrength') * 0.1;
  if (Math.abs(sim.tilt) > maxTilt && sim.grounded) {
    if (sim.shieldFrames === 0) { crash('Rolled over!'); return true; }
  }

  /* ── Heat system ───────────────────────────────────── */
  const vDef = vehicle; // vehicle definition
  if (sim.accelerating && sim.fuel > 0) {
    sim.heat += vDef.heatRate * PHYS.HEAT_RATE / 100 * (turboActive ? 1.8 : 1);
  } else {
    sim.heat -= PHYS.COOL_RATE / 100;
  }
  sim.heat = Math.max(0, Math.min(1, sim.heat));

  if (sim.heat >= 1) { crash('Overheated!'); return true; }
  if (getUpg('overheatWarning') && sim.heat > 0.7) {
    // Trigger warning once in a while
    if (Math.random() < 0.01) sfxOverheat();
  }

  /* ── Fuel system ─────────────────────────────────────── */
  if (sim.accelerating) {
    sim.fuel -= vDef.fuelDrain * (turboActive ? 2 : 1);
  } else {
    // Passive drain (engine idle)
    sim.fuel -= vDef.fuelDrain * 0.15;
  }
  // Fuel cell collectible recovery happens in game.js via checkCollectibles
  sim.fuel = Math.max(0, Math.min(PHYS.FUEL_MAX, sim.fuel));
  if (sim.fuel <= 0) { crash('Out of Fuel!'); return true; }

  /* ── Shield tick ─────────────────────────────────────── */
  if (sim.shieldFrames > 0) sim.shieldFrames--;

  /* ── Distance ────────────────────────────────────────── */
  sim.distance = Math.floor(sim.x / 10);

  return false; // no crash
}

/* Trigger crash */
function crash(reason) {
  sim.crashed     = true;
  sim.crashReason = reason;
  sfxCrash();
}

/* Use turbo */
function activateTurbo() {
  if (sim.turboCharges > 0 && sim.turboFrames === 0) {
    sim.turboFrames  = 90 + getUpg('turboBoost') * 30;
    sim.turboCharges--;
    sfxBoost();
  }
}

/* ── Collectible pickup (called from game.js) ─────────── */
function pickupCollectible(c) {
  c.collected = true;
  if (c.type === 'coin') {
    sim.coinsRun++;
    sfxCoin();
    showFloatText('+1🪙', c.wx, c.y);
  } else if (c.type === 'fuelCell') {
    sim.fuelCellsRun++;
    sim.fuel = Math.min(PHYS.FUEL_MAX, sim.fuel + 30);
    sfxFuelCell();
    showFloatText('⛽+30', c.wx, c.y);
  } else if (c.type === 'blueprint') {
    sim.blueprintsRun++;
    sfxBlueprint();
    showFloatText('+1📐', c.wx, c.y);
  } else if (c.type === 'boostPad') {
    activateTurbo();
    showFloatText('⚡TURBO!', c.wx, c.y);
  }
}

/* ── Float text helper ─────────────────────────────────── */
function showFloatText(text, wx, wy) {
  const el = document.createElement('div');
  el.className = 'float-pop';
  el.style.cssText = `left:${wx - (typeof cameraX !== 'undefined' ? cameraX : 0)}px;top:${wy}px;color:#ffd740`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

/* ── Collision check against collectibles ─────────────── */
function checkCollectibles(cameraX, baseY) {
  const vDef   = getSelectedVehicle();
  const sx     = sim.x - cameraX;  // screen X of vehicle
  const sy     = sim.y;
  const magnetR = getMagnetRadius();

  collectibles.forEach(c => {
    if (c.collected) return;
    const csx = c.wx - cameraX;
    const dx = csx - sx, dy = c.y - sy;
    const dist = Math.hypot(dx, dy);
    // Magnet pull for coins/blueprints
    if (dist < magnetR && (c.type === 'coin' || c.type === 'blueprint')) {
      c.wx -= dx * 0.06; c.y -= dy * 0.06;
    }
    if (dist < 22) pickupCollectible(c);
  });
}
