#!/usr/bin/env bash
# ============================================================
# Airplane Games – Font Downloader
# Run this script once to download the required WOFF2 fonts
# from Google Fonts into this directory.
#
# Usage:
#   cd fonts/
#   chmod +x download-fonts.sh
#   ./download-fonts.sh
# ============================================================

set -euo pipefail

FONTS_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Inter ────────────────────────────────────────────────────
# Source: https://fonts.google.com/specimen/Inter
# Direct download via the Google Fonts CSS v2 API (static subset)

echo "Downloading Inter Regular..."
curl -L -o "$FONTS_DIR/Inter-Regular.woff2" \
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"

echo "Downloading Inter Bold..."
curl -L -o "$FONTS_DIR/Inter-Bold.woff2" \
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2"

# ── Outfit ───────────────────────────────────────────────────
# Source: https://fonts.google.com/specimen/Outfit

echo "Downloading Outfit Regular..."
curl -L -o "$FONTS_DIR/Outfit-Regular.woff2" \
  "https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4G-EiAou6Y.woff2"

echo "Downloading Outfit Bold..."
curl -L -o "$FONTS_DIR/Outfit-Bold.woff2" \
  "https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1O4a-EiAou6Y.woff2"

echo ""
echo "Done! Font files written to: $FONTS_DIR"
echo ""
echo "Alternatively, you can self-host fonts downloaded from:"
echo "  https://fonts.google.com/specimen/Inter"
echo "  https://fonts.google.com/specimen/Outfit"
echo ""
echo "Or use the fontsource npm packages:"
echo "  npm install @fontsource/inter @fontsource/outfit"
