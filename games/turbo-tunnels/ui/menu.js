/* =============================================================
   ui/menu.js — Screen management + start/gameover/pause screens
   ============================================================= */

const SCREEN_IDS = ['startScreen','vehicleScreen','pauseScreen','gameoverScreen','shopScreen','settingsScreen'];

function showScreen(id) {
  SCREEN_IDS.forEach(s => document.getElementById(s).classList.add('hidden'));
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('gaugeWrap').classList.add('hidden');
  if (id) document.getElementById(id).classList.remove('hidden');
}

function refreshStartStats() {
  document.getElementById('bestDist').textContent       = saveData.bestDistance + 'm';
  document.getElementById('totalCoins').textContent     = saveData.coins;
  document.getElementById('totalBlueprints').textContent= saveData.blueprints;
}

function showGameOver(reason) {
  showScreen('gameoverScreen');
  document.getElementById('goDist').textContent       = sim.distance + 'm';
  document.getElementById('goSub').textContent        = 'Best: ' + saveData.bestDistance + 'm';
  document.getElementById('goCoins').textContent      = sim.coinsRun;
  document.getElementById('goFuel').textContent       = sim.fuelCellsRun;
  document.getElementById('goBlueprints').textContent = sim.blueprintsRun;
  document.getElementById('goCrashReason').textContent= reason;

  const isNew = sim.distance > saveData.bestDistance;
  document.getElementById('newRecordBadge').classList.toggle('hidden', !isNew);
  if (isNew) saveData.bestDistance = sim.distance;

  saveData.coins      += sim.coinsRun;
  saveData.blueprints += sim.blueprintsRun;
  persist();

  if (typeof Scores !== 'undefined') Scores.set('turbo-tunnels', sim.distance);
  refreshStartStats();
}

/* ── Button wiring ──────────────────────────────────────── */
function wireMenuButtons() {
  document.getElementById('playBtn').addEventListener('click', () => startRun());
  document.getElementById('playAgainBtn').addEventListener('click', () => startRun());
  document.getElementById('vehicleBtn').addEventListener('click', () => { buildVehicleGrid(); showScreen('vehicleScreen'); });
  document.getElementById('vehicleBackBtn').addEventListener('click', () => showScreen('startScreen'));
  document.getElementById('shopBtn').addEventListener('click', () => { buildShop(); showScreen('shopScreen'); });
  document.getElementById('shopBackBtn').addEventListener('click', () => showScreen('startScreen'));
  document.getElementById('goShopBtn').addEventListener('click', () => { buildShop(); showScreen('shopScreen'); });
  document.getElementById('goMenuBtn').addEventListener('click', () => { showScreen('startScreen'); refreshStartStats(); });
  document.getElementById('settingsBtn').addEventListener('click', () => showScreen('settingsScreen'));
  document.getElementById('settingsBackBtn').addEventListener('click', () => showScreen('startScreen'));
  document.getElementById('muteBtn').addEventListener('click', toggleMute);
  document.getElementById('pauseBtn').addEventListener('click', () => pauseRun());
  document.getElementById('resumeBtn').addEventListener('click', () => resumeRun());
  document.getElementById('pauseRestartBtn').addEventListener('click', () => startRun());
  document.getElementById('pauseMenuBtn').addEventListener('click', () => {
    gameActive = false; stopMusic();
    showScreen('startScreen'); refreshStartStats();
  });
  document.getElementById('musicVol').addEventListener('input', e => setMusicVol(+e.target.value));
  document.getElementById('sfxVol').addEventListener('input',   e => { setSfxVol(+e.target.value); ensureAudio(); });
}
