/* =============================================================
   engine/tunnels.js — Procedural tunnel segment generation
   Tunnel = series of segments, each with a floor Y curve and ceiling Y.
   Player vehicle drives along the floor.
   ============================================================= */

/* Segment types:
   'flat'   — gentle slope
   'hill'   — uphill then down
   'dip'    — down then up
   'jump'   — ramp with gap (brief air section)
   'loop'   — full loop (only in later zones)
*/

const SEG_LENGTH  = 60;   // world-units per segment (horizontal pixels)
const LOOK_AHEAD  = 30;   // segments to pre-generate ahead of camera

/* Tunnel state — populated by buildTunnel() and grown by growTunnel() */
let tunnelSegments = [];  // Array of { worldX, floorY, ceilY, type, zone }
let tunnelGenX     = 0;   // next worldX to generate

/* Noise helper — sum of sines, deterministic from worldX */
function tunnelNoise(x, amp, freq, phase) {
  return (
    Math.sin(x * freq + phase)            * amp +
    Math.sin(x * freq * 2.1 + phase + 1) * amp * 0.35 +
    Math.sin(x * freq * 0.5 + phase + 2) * amp * 0.5
  );
}

/* Generate one new segment at worldX */
function makeSegment(worldX, zone) {
  const base   = 0;  // floor offset from canvas midpoint — we add canvas.height/2 in rendering
  const noise  = tunnelNoise(worldX, zone.hillAmp, zone.hillFreq, zone.id.charCodeAt(0));
  const floorY = noise;          // relative to baseline (positive = down)
  const tunnelH = 160 + (zone.hillAmp * 0.4);  // tunnel height increases in wilder zones
  const ceilY  = floorY - tunnelH;

  // Loop segment special handling
  let type = 'normal';
  if (zone.loopChance > 0 && Math.random() < zone.loopChance / SEG_LENGTH) {
    type = 'loop_start';  // marker for renderer/physics to handle loop arc
  }

  return { worldX, floorY, ceilY, type, zoneId: zone.id };
}

/* Build initial tunnel around startX */
function buildTunnel(startX, zone) {
  tunnelSegments = [];
  tunnelGenX     = startX;
  for (let i = 0; i < LOOK_AHEAD * 2; i++) {
    tunnelSegments.push(makeSegment(tunnelGenX, zone));
    tunnelGenX += SEG_LENGTH;
  }
}

/* Grow tunnel forward, cull behind camera */
function growTunnel(cameraX, zone) {
  const visEnd = cameraX + 1200;
  while (tunnelGenX < visEnd + SEG_LENGTH * 5) {
    tunnelSegments.push(makeSegment(tunnelGenX, zone));
    tunnelGenX += SEG_LENGTH;
  }
  // Cull segments far behind
  const cutoff = cameraX - 400;
  while (tunnelSegments.length > 0 && tunnelSegments[0].worldX < cutoff) {
    tunnelSegments.shift();
  }
}

/* Get interpolated floor Y at any worldX position (canvas-relative) */
function getFloorY(worldX, baseY) {
  // Find surrounding segments
  for (let i = 0; i < tunnelSegments.length - 1; i++) {
    const a = tunnelSegments[i], b = tunnelSegments[i + 1];
    if (worldX >= a.worldX && worldX < b.worldX) {
      const t = (worldX - a.worldX) / (b.worldX - a.worldX);
      return baseY + a.floorY + (b.floorY - a.floorY) * t;
    }
  }
  // Fallback: return last segment
  const last = tunnelSegments[tunnelSegments.length - 1];
  return last ? baseY + last.floorY : baseY;
}

/* Get interpolated ceiling Y */
function getCeilY(worldX, baseY) {
  for (let i = 0; i < tunnelSegments.length - 1; i++) {
    const a = tunnelSegments[i], b = tunnelSegments[i + 1];
    if (worldX >= a.worldX && worldX < b.worldX) {
      const t = (worldX - a.worldX) / (b.worldX - a.worldX);
      return baseY + a.ceilY + (b.ceilY - a.ceilY) * t;
    }
  }
  const last = tunnelSegments[tunnelSegments.length - 1];
  return last ? baseY + last.ceilY : baseY - 160;
}

/* Get floor slope angle (radians) at worldX — used for vehicle tilt */
function getFloorAngle(worldX, baseY) {
  const dx = 4;
  const y1 = getFloorY(worldX,    baseY);
  const y2 = getFloorY(worldX+dx, baseY);
  return Math.atan2(y2 - y1, dx);
}

/* ── Tunnel renderer ──────────────────────────────────────── */
function drawTunnel(ctx, cameraX, baseY, zone) {
  const W = ctx.canvas.width, H = ctx.canvas.height;

  /* Parallax cave background (3 layers) */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, zone.bgTop);
  bg.addColorStop(0.5, zone.bgMid);
  bg.addColorStop(1, zone.bgBot);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Parallax rock layers (further back)
  for (let layer = 0; layer < 2; layer++) {
    const pFactor = 0.3 + layer * 0.2;
    const opacity = 0.15 - layer * 0.05;
    ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = zone.wallColor;
    for (let px = -SEG_LENGTH; px <= W + SEG_LENGTH; px += SEG_LENGTH * 2) {
      const wx = cameraX * pFactor + px;
      const fy = getFloorY(wx, baseY) + (layer + 1) * 20;
      const cy = getCeilY(wx, baseY)  - (layer + 1) * 20;
      ctx.beginPath();
      ctx.rect(px - SEG_LENGTH * 0.5, fy, SEG_LENGTH * 3, H - fy);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(px - SEG_LENGTH * 0.5, 0, SEG_LENGTH * 3, cy);
      ctx.fill();
    }
    ctx.restore();
  }

  /* Main tunnel polygon — floor */
  ctx.fillStyle = zone.wallColor;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let px = 0; px <= W; px += 3) {
    const wx = cameraX + px;
    const fy = getFloorY(wx, baseY);
    if (px === 0) ctx.moveTo(px, fy); else ctx.lineTo(px, fy);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  /* Ceiling */
  ctx.fillStyle = zone.ceilColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let px = 0; px <= W; px += 3) {
    const wx = cameraX + px;
    const cy = getCeilY(wx, baseY);
    if (px === 0) ctx.moveTo(px, cy); else ctx.lineTo(px, cy);
  }
  ctx.lineTo(W, 0); ctx.closePath(); ctx.fill();

  /* Accent glow on floor surface */
  ctx.save();
  ctx.strokeStyle = zone.accentColor + '55';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = zone.accentColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let px = 0; px <= W; px += 3) {
    const wx = cameraX + px;
    const fy = getFloorY(wx, baseY);
    if (px === 0) ctx.moveTo(px, fy); else ctx.lineTo(px, fy);
  }
  ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

/* ── Collectibles spawning (tied to tunnel) ─────────────── */
let collectibles  = [];
let nextCollWX    = 300;

function spawnCollectibles(cameraX, baseY, zone) {
  while (nextCollWX < cameraX + 1200) {
    const wx   = nextCollWX;
    const fy   = getFloorY(wx, baseY);
    const gap  = fy - getCeilY(wx, baseY);
    const yOff = gap * (0.2 + Math.random() * 0.5);
    const r    = Math.random();
    let type;
    if (r < 0.55)       type = 'coin';
    else if (r < 0.78)  type = 'coin';
    else if (r < 0.9)   type = 'fuelCell';
    else if (r < 0.97)  type = 'blueprint';
    else                type = 'boostPad';

    collectibles.push({
      wx, y: fy - yOff, type,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2,
    });
    nextCollWX += 55 + Math.random() * 80;
  }
  // Cull behind camera
  const cut = cameraX - 300;
  collectibles = collectibles.filter(c => c.wx > cut);
}

function drawCollectibles(ctx, cameraX, baseY, frameCount) {
  const zone = getZone(cameraX / 10);  // approximate dist
  collectibles.forEach(c => {
    if (c.collected) return;
    const sx = c.wx - cameraX;
    if (sx < -40 || sx > ctx.canvas.width + 40) return;
    const bob = Math.sin(frameCount * 0.07 + c.bobOffset) * 4;
    const y = c.y + bob;

    ctx.save();
    if (c.type === 'coin') {
      ctx.fillStyle = '#ffd740'; ctx.shadowColor = '#ffd740'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(sx, y, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff5'; ctx.beginPath(); ctx.arc(sx-2, y-2, 3, 0, Math.PI*2); ctx.fill();
    } else if (c.type === 'fuelCell') {
      ctx.fillStyle = '#00e676'; ctx.shadowColor = '#00e676'; ctx.shadowBlur = 10;
      ctx.fillRect(sx-7, y-11, 14, 22); ctx.strokeStyle = '#69f0ae'; ctx.lineWidth = 1.5;
      ctx.strokeRect(sx-7, y-11, 14, 22);
      ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⛽', sx, y);
    } else if (c.type === 'blueprint') {
      ctx.fillStyle = '#e040fb'; ctx.shadowColor = '#e040fb'; ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(sx, y-12); ctx.lineTo(sx+8, y); ctx.lineTo(sx, y+10); ctx.lineTo(sx-8, y); ctx.closePath(); ctx.fill();
    } else if (c.type === 'boostPad') {
      ctx.fillStyle = '#ff6d00'; ctx.shadowColor = '#ff6d00'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(sx-18, y-8, 36, 16, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('TURBO', sx, y);
    }
    ctx.shadowBlur = 0; ctx.restore();
  });
}
