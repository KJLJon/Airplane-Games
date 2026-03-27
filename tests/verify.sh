#!/bin/bash
# Airplane Games — PWA Verification Tests
# Run from repo root: bash tests/verify.sh

PASS=0; FAIL=0; ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ok() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }
section() { echo; echo "=== $1 ==="; }

section "Core Files"
for f in index.html manifest.json sw.js css/main.css js/shared.js; do
  [ -f "$ROOT/$f" ] && ok "$f exists" || fail "$f MISSING"
done

section "Icons"
for f in icons/icon-192.png icons/icon-512.png icons/icon-maskable.png; do
  [ -f "$ROOT/$f" ] && ok "$f exists" || fail "$f MISSING"
done

section "Font Files"
for f in fonts/Inter-Regular.woff2 fonts/Inter-Bold.woff2 fonts/Outfit-Regular.woff2 fonts/Outfit-Bold.woff2; do
  [ -f "$ROOT/$f" ] && ok "$f exists" || fail "$f MISSING"
done

section "Game Files (15 required)"
GAMES=(tetris sudoku runner chess-puzzles sliding-puzzle snake traffic minesweeper wordle 2048 dogfight maze stratego nonogram flapper)
for g in "${GAMES[@]}"; do
  [ -f "$ROOT/games/$g/index.html" ] && ok "games/$g/index.html" || fail "games/$g/index.html MISSING"
done

section "PWA Manifest Validation"
if command -v python3 &>/dev/null; then
  python3 - "$ROOT/manifest.json" <<'PYEOF'
import json, sys
try:
  m = json.load(open(sys.argv[1]))
  checks = [
    ("name", "name" in m),
    ("start_url", "start_url" in m),
    ("display=standalone", m.get("display")=="standalone"),
    ("icons array", isinstance(m.get("icons",[]),list) and len(m["icons"])>=2),
    ("theme_color", "theme_color" in m),
    ("scope", "scope" in m),
  ]
  for name, ok in checks:
    print(f"  {'✓' if ok else '✗'} manifest: {name}")
except Exception as e:
  print(f"  ✗ manifest parse error: {e}")
PYEOF
else
  echo "  ⚠ python3 not found, skipping JSON checks"
fi

section "HTML Checks (base tag + key assets)"
python3 - "$ROOT" <<'PYEOF' 2>/dev/null || echo "  ⚠ python3 not found"
import os, sys
from pathlib import Path

root = sys.argv[1]
pages = [Path(root)/"index.html"] + list(Path(root).glob("games/*/index.html"))

for p in pages:
  content = p.read_text(errors='ignore')
  name = str(p.relative_to(root))
  issues = []
  if '<base href="/Airplane-Games/">' not in content:
    issues.append("missing base tag")
  if 'css/main.css' not in content:
    issues.append("missing main.css link")
  if name != "index.html" and 'js/shared.js' not in content:
    issues.append("missing shared.js")
  if issues:
    print(f"  ✗ {name}: {', '.join(issues)}")
  else:
    print(f"  ✓ {name}")
PYEOF

section "Service Worker Cache List"
python3 - "$ROOT/sw.js" <<'PYEOF' 2>/dev/null || echo "  ⚠ python3 not found"
import re, sys
content = open(sys.argv[1]).read()
games = ["tetris","sudoku","runner","chess-puzzles","sliding-puzzle","snake","traffic",
         "minesweeper","wordle","2048","dogfight","maze","stratego","nonogram","flapper"]
for g in games:
  path = f"games/{g}/index.html"
  if path in content:
    print(f"  ✓ {path} in cache list")
  else:
    print(f"  ✗ {path} NOT in cache list")
PYEOF

section "No External CDN Links"
python3 - "$ROOT" <<'PYEOF' 2>/dev/null || echo "  ⚠ python3 not found"
import os, sys
from pathlib import Path
root = Path(sys.argv[1])
cdn_patterns = ["cdn.jsdelivr", "unpkg.com", "cdnjs.cloudflare", "googleapis.com/css",
                "fonts.gstatic", "ajax.googleapis"]
issues = []
for p in list(root.glob("**/*.html")) + list(root.glob("**/*.js")) + list(root.glob("**/*.css")):
  if '.git' in str(p): continue
  content = p.read_text(errors='ignore')
  for cdn in cdn_patterns:
    if cdn in content:
      issues.append(f"{p.relative_to(root)}: {cdn}")
if issues:
  for i in issues: print(f"  ✗ CDN reference: {i}")
else:
  print(f"  ✓ No CDN links found")
PYEOF

section "Shared.js Functions"
python3 - "$ROOT/js/shared.js" <<'PYEOF' 2>/dev/null || echo "  ⚠ python3 not found"
import sys
content = open(sys.argv[1]).read()
funcs = ["createRNG", "Scores", "getDailySeed", "getLevelSeed", "showToast", "serviceWorker"]
for f in funcs:
  if f in content:
    print(f"  ✓ {f} present")
  else:
    print(f"  ✗ {f} MISSING")
PYEOF

echo
echo "================================"
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "All checks passed! ✓" || echo "Some checks failed ✗"
echo "================================"
exit $FAIL
