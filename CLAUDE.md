# Airplane-Games

PWA game hub with 18 standalone browser games. No build tools — pure vanilla JS/HTML/CSS.

## Structure

```
index.html          # Game hub & GAMES registry
js/shared.js        # Shared utilities (RNG, scores, toasts)
css/main.css        # Shared styles
games/[game-id]/
  index.html        # Self-contained game (200–700 lines)
```

## Adding a New Game

1. **Create** `games/my-game/index.html` — fully self-contained, no modules
2. **Include** in the HTML head:
   ```html
   <base href="/Airplane-Games/">
   <link rel="stylesheet" href="css/main.css">
   <script src="js/shared.js"></script>
   ```
3. **Register** in `index.html` `GAMES` array (~line 378):
   ```js
   {
     id: 'my-game',
     title: 'My Game',
     badge: 'Puzzle',   // Puzzle | Endless | Strategy | Action | Memory | Runner
     desc: 'Short description',
     path: 'games/my-game/',
     accent: '#hexcolor',
     icon: `<svg viewBox="0 0 24 24" aria-hidden="true">...</svg>`,
   }
   ```
4. **Add** the `id` to `Scores.getAll()` in `js/shared.js` (~line 45) for score tracking

## Shared Utilities (`js/shared.js`)

- `Scores.get(id)` / `Scores.set(id, score, seed)` — localStorage high scores (`ag_score_[id]`)
- `getDailySeed(id)` / `getLevelSeed(id, level)` — deterministic seeds
- `createRNG(seed)` — Mulberry32 seeded RNG
- `showToast(msg, duration)` — toast notifications

## Notes

- Games must work fully offline
- Use `localStorage` for persistence; key prefix `ag_`
- PWA config in `manifest.json` and `sw.js` — no changes needed for new games
