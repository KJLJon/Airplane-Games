# ✈️ Airplane Games

A collection of **18 offline games** for playing on phones in airplane mode. No WiFi, no internet, no ads, no tracking — just pure offline fun.

## 📱 About

Airplane Games is a Progressive Web App (PWA) featuring a curated collection of classic and original games designed specifically for offline play. Install it on your Android or iOS device and enjoy seamless gameplay without connectivity.

### Features
- ✅ **100% Offline** – All games work completely offline after initial load
- ✅ **No Ads** – Ad-free gaming experience
- ✅ **No Tracking** – Your privacy is protected
- ✅ **Installable** – Works as a standalone PWA on Android and iOS
- ✅ **High Score Tracking** – Local score storage per device
- ✅ **Responsive** – Optimized for phones, tablets, and browsers
- ✅ **Lightweight** – Fast loading and minimal storage footprint

### Available Games

The collection includes 18 games across multiple genres:

- **Puzzle Games:** Sudoku, Sliding Puzzle, Cloud Maze, Minesweeper, Wordle, 2048, Flight Nonogram
- **Endless Games:** Tetris, Endless Runner, Snake, Jet Stream
- **Runner Games:** Multiplier Runner
- **Strategy Games:** Chess Puzzles, Traffic Director, Stratego Lite
- **Action Games:** Dogfight, Lane Shooter
- **Memory Games:** Simon

---

## 🎮 How to Add/Register a New Game

### Step 1: Create the Game Folder Structure

Create a new folder in the `games/` directory:

```
games/
└── my-game/
    ├── index.html
    └── (other game assets)
```

### Step 2: Build Your Game

Create an `index.html` file for your game. Your game should:
- Load assets relative to its own directory (or use the base href)
- Use vanilla JavaScript (no build tools required)
- Be fully self-contained within `games/my-game/`
- Handle offline playback (no external API calls)

You can use shared utilities from `js/shared.js` if needed:
- **`Scores.get(gameId)`** – Retrieve saved high score
- **`Scores.set(gameId, score, seed)`** – Save a new high score
- **`getDailySeed(gameId)`** – Get a consistent seed for the day
- **`getLevelSeed(gameId, level)`** – Get a consistent seed for a level
- **`createRNG(seed)`** – Create a seeded pseudo-random number generator
- **`showToast(message, duration)`** – Display a notification toast

### Step 3: Register the Game in `/index.html`

Open `index.html` and locate the `GAMES` array (around line 378). Add a new game object with the following properties:

```javascript
const GAMES = [
  // ... existing games ...
  {
    id: 'my-game',                    // Unique identifier (used for high score storage)
    title: 'My Game',                 // Display title
    badge: 'Puzzle',                  // Category: "Puzzle", "Endless", "Strategy", "Action"
    desc: 'Game description here',    // Short description (this appears on the hub)
    path: 'games/my-game/',           // Path to the game folder
    accent: '#3498db',                // Color for the card (hex format)
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true">
      <!-- Your SVG icon here -->
    </svg>`,
  },
];
```

### Step 4: (Optional) Update `shared.js`

If you want to track high scores in the hub, add your game ID to the `Scores.getAll()` function in `js/shared.js`:

```javascript
getAll() {
  const games = ['tetris', 'sudoku', 'runner', ..., 'my-game'];
  // ... rest of the function
}
```

### Properties Explained

| Property | Description | Examples |
|----------|-------------|----------|
| `id` | Unique identifier for localStorage keys | `'my-game'` |
| `title` | Game name shown on the hub | `'My Game'` |
| `badge` | Genre/category badge | `'Puzzle'`, `'Endless'`, `'Strategy'`, `'Action'` |
| `desc` | Short description shown on card | Keep it concise (40-50 chars) |
| `path` | Path to game folder (must end with `/`) | `'games/my-game/'` |
| `accent` | Card accent color (hex color code) | `'#FF6B6B'`, `'#4ECDC4'` |
| `icon` | SVG icon (24x24 viewBox recommended) | Inline SVG string, no imports |

---

## 🏗️ Project Structure

```
Airplane-Games/
├── index.html              # Game hub/launcher
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker for offline support
├── css/
│   └── main.css            # Shared styles
├── js/
│   └── shared.js           # Shared utilities (RNG, scores, toasts)
├── games/
│   ├── 2048/
│   ├── chess-puzzles/
│   ├── dogfight/
│   ├── flapper/
│   ├── maze/
│   ├── minesweeper/
│   ├── nonogram/
│   ├── runner/
│   ├── sliding-puzzle/
│   ├── snake/
│   ├── stratego/
│   ├── sudoku/
│   ├── tetris/
│   ├── traffic/
│   └── wordle/
└── icons/                  # PWA icons
    ├── icon-192.png
    ├── icon-512.png
    └── icon-maskable.png
```

---

## 🚀 Installation & Deployment

### Local Development

A simple HTTP server will work fine:

```bash
# Using Python 3:
python -m http.server 8000

# Using Node.js:
npx http-server

# Using PHP:
php -S localhost:8000
```

Then visit `http://localhost:8000/` in your browser.

### PWA Installation

1. Open the app in a browser
2. Look for the "Install" button (appears on Android and some desktop browsers)
3. Click to install as a standalone app

### Deployment

The app can be deployed to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Any standard web server

Ensure the base path in `index.html` matches your deployment path.

---

## 💾 Score Storage

High scores are stored locally in the browser's localStorage under keys like `ag_score_<gameId>`. Each score record contains:
- `score` – The score value
- `date` – ISO timestamp of when it was achieved
- `seed` – (Optional) Random seed used for procedural generation

Scores are persistent to the device and not synced across devices.

---

## 🛠️ Contributing

Want to add a new game? Follow the **"How to Add/Register a New Game"** section above. Make sure your game:
- Works 100% offline
- Follows the established folder structure
- Uses descriptive, user-friendly text
- Includes proper semantic HTML and ARIA labels
- Fits the "offline airplane games" theme

---

## 📄 License

[Add your license here if applicable]