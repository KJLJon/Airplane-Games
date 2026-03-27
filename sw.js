const CACHE_VERSION = 'airplane-games-v1';

const PRECACHE_URLS = [
  '/airplane-games/',
  '/airplane-games/index.html',
  '/airplane-games/manifest.json',
  '/airplane-games/css/main.css',
  '/airplane-games/js/shared.js',
  '/airplane-games/icons/icon-192.png',
  '/airplane-games/icons/icon-512.png',
  '/airplane-games/icons/icon-maskable.png',
  '/airplane-games/fonts/Inter-Regular.woff2',
  '/airplane-games/fonts/Inter-Bold.woff2',
  '/airplane-games/fonts/Outfit-Regular.woff2',
  '/airplane-games/fonts/Outfit-Bold.woff2',
  '/airplane-games/games/tetris/index.html',
  '/airplane-games/games/sudoku/index.html',
  '/airplane-games/games/runner/index.html',
  '/airplane-games/games/chess-puzzles/index.html',
  '/airplane-games/games/sliding-puzzle/index.html',
  '/airplane-games/games/snake/index.html',
  '/airplane-games/games/traffic/index.html',
  '/airplane-games/games/minesweeper/index.html',
  '/airplane-games/games/wordle/index.html',
  '/airplane-games/games/2048/index.html',
  '/airplane-games/games/dogfight/index.html',
  '/airplane-games/games/maze/index.html',
  '/airplane-games/games/stratego/index.html',
  '/airplane-games/games/nonogram/index.html',
  '/airplane-games/games/flapper/index.html',
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline – Airplane Games</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0d0d10;
      color: #f0f0f5;
      font-family: Inter, -apple-system, 'Helvetica Neue', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }
    .container { max-width: 380px; }
    .icon { font-size: 64px; margin-bottom: 24px; }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #7c6af7;
    }
    p {
      color: #888899;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      background: transparent;
      border: 2px solid #f7a94a;
      color: #f7a94a;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      background: rgba(247,169,74,0.12);
      box-shadow: 0 0 14px rgba(247,169,74,0.35);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✈️</div>
    <h1>You're Offline</h1>
    <p>Looks like you've lost your connection. The games you've already visited are available — try going back to the hub.</p>
    <a href="/airplane-games/" class="btn">Back to Hub</a>
  </div>
</body>
</html>`;

// ── Install: pre-cache all known assets ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // Cache assets individually so one 404 doesn't abort everything
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Failed to cache', url, err)
          )
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: delete stale caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, network fallback, offline page last resort ────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests within our scope
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/airplane-games/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Cache successful responses for future offline use
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network failed — serve offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return new Response(OFFLINE_HTML, {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
          // For other assets just return a 503
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});
