/* =============================================================
   engine/audio.js — Web Audio API SFX + music (all procedural)
   ============================================================= */

let audioCtx = null, musicGain = null, sfxGain = null;
let musicTimers = [];
let isMuted = false;
let musicVol = 0.35, sfxVol = 0.7;
let engineOsc = null, engineGain = null;  // continuous engine hum

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain(); musicGain.gain.value = musicVol; musicGain.connect(audioCtx.destination);
  sfxGain   = audioCtx.createGain(); sfxGain.gain.value   = sfxVol;   sfxGain.connect(audioCtx.destination);
}
function ensureAudio() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function toggleMute() {
  isMuted = !isMuted;
  if (audioCtx) { musicGain.gain.value = isMuted ? 0 : musicVol; sfxGain.gain.value = isMuted ? 0 : sfxVol; }
  const btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
}
function setMusicVol(v) {
  musicVol = v / 100; saveData.settings.musicVol = v; persist();
  if (audioCtx && !isMuted) musicGain.gain.value = musicVol;
}
function setSfxVol(v) {
  sfxVol = v / 100; saveData.settings.sfxVol = v; persist();
  if (audioCtx && !isMuted) sfxGain.gain.value = sfxVol;
}

/* Background music — driving pulse + low synth pad */
function startMusic() {
  if (!audioCtx) return;
  stopMusic();
  // Bass drone
  const drone = audioCtx.createOscillator(), dg = audioCtx.createGain();
  drone.type = 'sawtooth'; drone.frequency.value = 55;
  dg.gain.value = 0.04;
  drone.connect(dg); dg.connect(musicGain); drone.start();
  musicTimers.push(() => { try { drone.stop(); } catch(_) {} });

  // Rhythmic pulse notes
  const beat = [110, 110, 165, 110, 110, 138, 110, 110];
  let bi = 0;
  function schedBeat() {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = beat[bi++ % beat.length];
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.2);
    musicTimers.push(setTimeout(schedBeat, 230));
  }
  schedBeat();
}
function stopMusic() {
  musicTimers.forEach(x => typeof x === 'function' ? x() : clearTimeout(x));
  musicTimers = [];
  stopEngineHum();
}

/* Engine hum — continuous oscillator pitched to speed */
function startEngineHum(vehicle) {
  if (!audioCtx) return;
  stopEngineHum();
  engineOsc  = audioCtx.createOscillator();
  engineGain = audioCtx.createGain();
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.value = vehicle ? vehicle.engineBaseFreq : 80;
  engineGain.gain.value = 0.08;
  engineOsc.connect(engineGain); engineGain.connect(sfxGain);
  engineOsc.start();
}
function stopEngineHum() {
  if (engineOsc) { try { engineOsc.stop(); } catch(_) {} engineOsc = null; engineGain = null; }
}
function updateEngineHum(speedRatio, accelerating) {
  if (!engineOsc) return;
  const base = engineOsc.frequency.value;
  const target = 60 + speedRatio * 120 + (accelerating ? 30 : 0);
  engineOsc.frequency.setTargetAtTime(target, audioCtx.currentTime, 0.1);
  if (engineGain) engineGain.gain.setTargetAtTime(accelerating ? 0.12 : 0.06, audioCtx.currentTime, 0.1);
}

/* SFX */
function sfxCoin() {
  if (!audioCtx) return;
  [880, 1108].forEach((f, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    const t = audioCtx.currentTime + i * 0.04;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.12);
  });
}
function sfxFuelCell() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'triangle'; const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.2);
  g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.26);
}
function sfxBlueprint() {
  if (!audioCtx) return;
  [523.2, 659.3, 783.9, 1046.5].forEach((f, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    const t = audioCtx.currentTime + i * 0.07;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.16);
  });
}
function sfxBoost() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sawtooth'; const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.2);
  g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.22);
}
function sfxOverheat() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square'; const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(800, t); o.frequency.linearRampToValueAtTime(200, t + 0.3);
  g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.36);
}
function sfxCrash() {
  if (!audioCtx) return;
  stopEngineHum();
  // Noise burst
  const sr = audioCtx.sampleRate, len = sr * 0.5;
  const buf = audioCtx.createBuffer(1, len, sr);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.8);
  const s = audioCtx.createBufferSource(), g = audioCtx.createGain();
  s.buffer = buf; g.gain.value = 0.6;
  s.connect(g); g.connect(sfxGain); s.start();
  // Metal clang
  [200, 312, 198].forEach((f, i) => {
    const o = audioCtx.createOscillator(), og = audioCtx.createGain();
    const t = audioCtx.currentTime + i * 0.05;
    o.type = 'sawtooth'; o.frequency.value = f;
    og.gain.setValueAtTime(0.3, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(og); og.connect(sfxGain); o.start(t); o.stop(t + 0.42);
  });
}
function sfxZone() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine'; const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(660, t + 0.25);
  g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.32);
}
function sfxLand() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sawtooth'; const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
  g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.13);
}
