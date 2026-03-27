/* ============================================================
   Airplane Games – Shared Utilities
   Vanilla JS, global scope, no modules required
   ============================================================ */

// ── Seeded PRNG (Mulberry32) ──────────────────────────────────
function createRNG(seed) {
  let s = seed >>> 0;
  return {
    random() {
      s += 0x6D2B79F5;
      let z = s;
      z = Math.imul(z ^ z >>> 15, z | 1);
      z ^= z + Math.imul(z ^ z >>> 7, z | 61);
      return ((z ^ z >>> 14) >>> 0) / 4294967296;
    },
    int(min, max) { return Math.floor(this.random() * (max - min + 1)) + min; },
    pick(arr) { return arr[Math.floor(this.random() * arr.length)]; },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  };
}

// ── LocalStorage High Score Management ───────────────────────
const Scores = {
  get(gameId) {
    try { return JSON.parse(localStorage.getItem('ag_score_' + gameId)) || null; } catch { return null; }
  },
  set(gameId, score, seed) {
    const existing = this.get(gameId);
    if (!existing || score > existing.score) {
      const data = { score, date: new Date().toISOString() };
      if (seed !== undefined) data.seed = seed;
      try { localStorage.setItem('ag_score_' + gameId, JSON.stringify(data)); return true; } catch { return false; }
    }
    return false;
  },
  getAll() {
    const games = ['tetris','sudoku','runner','chess-puzzles','sliding-puzzle','snake','traffic','minesweeper','wordle','2048','dogfight','maze','stratego','nonogram','flapper'];
    const result = {};
    games.forEach(id => { result[id] = this.get(id); });
    return result;
  }
};

// ── Daily Seed Generator ──────────────────────────────────────
function getDailySeed(gameId) {
  const d = new Date();
  const dateStr = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  let hash = 0;
  const str = gameId + dateStr;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Level Seed Generator ──────────────────────────────────────
function getLevelSeed(gameId, level) {
  let hash = 0;
  const str = gameId + '_level_' + level;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Toast Notification ────────────────────────────────────────
function showToast(message, duration = 2000) {
  let toast = document.getElementById('ag-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ag-toast';
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e1e28;color:#f0f0f5;padding:12px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);z-index:9999;font-family:Inter,sans-serif;font-size:14px;pointer-events:none;transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, duration);
}

// ── Register Service Worker ───────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Airplane-Games/sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}
