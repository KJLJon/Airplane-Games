#!/usr/bin/env python3
"""
Airplane Games – Icon Generator
Creates icon-192.png, icon-512.png, and icon-maskable.png
using only Python's standard library (struct + zlib).

Design: dark navy background (#1a1a2e) with the letters "AG"
rendered in purple (#7c6af7) using a simple pixel-font approach.

Run from repo root:
    python3 icons/make_icons.py
"""

import struct
import zlib
import os

# ── Colours ──────────────────────────────────────────────────────────────────
BG_R,  BG_G,  BG_B  = 0x1a, 0x1a, 0x2e   # #1a1a2e  dark navy
ACC_R, ACC_G, ACC_B = 0x7c, 0x6a, 0xf7   # #7c6af7  purple accent
RIM_R, RIM_G, RIM_B = 0x2c, 0x2c, 0x4e   # slightly lighter for subtle border

# ── PNG helpers ───────────────────────────────────────────────────────────────

def _chunk(name: bytes, data: bytes) -> bytes:
    c = struct.pack('>I', len(data)) + name + data
    c += struct.pack('>I', zlib.crc32(name + data) & 0xFFFFFFFF)
    return c

def _png_bytes(pixels: list[list[tuple[int,int,int]]]) -> bytes:
    """Encode a 2-D list of (R,G,B) tuples as a PNG bytestring."""
    height = len(pixels)
    width  = len(pixels[0])

    # Build raw scanlines: filter byte (0 = None) + RGB triples
    raw = bytearray()
    for row in pixels:
        raw.append(0)                          # filter type None
        for r, g, b in row:
            raw.append(r); raw.append(g); raw.append(b)

    compressed = zlib.compress(bytes(raw), level=9)

    sig   = b'\x89PNG\r\n\x1a\n'
    ihdr  = _chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    idat  = _chunk(b'IDAT', compressed)
    iend  = _chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

# ── Pixel-font glyph data ─────────────────────────────────────────────────────
# Each glyph is a list of strings, '1' = filled, '0' = empty.
# Designed on a 7×9 grid.

GLYPH_A = [
    "0011100",
    "0100010",
    "1000001",
    "1000001",
    "1111111",
    "1000001",
    "1000001",
    "1000001",
    "1000001",
]

GLYPH_G = [
    "0111110",
    "1000001",
    "1000000",
    "1000000",
    "1001111",
    "1000001",
    "1000001",
    "1000001",
    "0111110",
]

GLYPHS = {"A": GLYPH_A, "G": GLYPH_G}

def _render_glyph(pixels, glyph_data, origin_x, origin_y, scale, fr, fg, fb):
    """Stamp a scaled glyph onto the pixel grid."""
    for gy, row_str in enumerate(glyph_data):
        for gx, bit in enumerate(row_str):
            if bit == '1':
                for dy in range(scale):
                    for dx in range(scale):
                        px = origin_x + gx * scale + dx
                        py = origin_y + gy * scale + dy
                        if 0 <= py < len(pixels) and 0 <= px < len(pixels[0]):
                            pixels[py][px] = (fr, fg, fb)

# ── Icon builder ──────────────────────────────────────────────────────────────

def make_icon(size: int, maskable: bool = False) -> bytes:
    """
    Build a square icon.
    - maskable=True adds a larger safe-zone padding (as per the maskable spec,
      the 'safe zone' is the inscribed circle, ~80 % of the canvas).
    """
    pixels = [[(BG_R, BG_G, BG_B)] * size for _ in range(size)]

    # Subtle circular rim
    cx = cy = size / 2
    outer_r = size / 2 - 1
    inner_r = outer_r - max(2, size // 80)
    for y in range(size):
        for x in range(size):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if inner_r <= dist <= outer_r:
                pixels[y][x] = (RIM_R, RIM_G, RIM_B)

    # For maskable icons the artwork should fit inside an 80 % circle
    safe = 0.72 if maskable else 0.88     # fraction of canvas width used
    content_size = int(size * safe)

    # Scale glyph to fit two characters side by side with a gap
    glyph_cols = 7                         # glyph width in pixel-font units
    glyph_rows = 9
    gap_units  = 1                         # gap between A and G in pixel-font units
    total_units = glyph_cols * 2 + gap_units

    scale = max(1, content_size // (total_units + 2))

    total_px_w = (glyph_cols * 2 + gap_units) * scale
    total_px_h = glyph_rows * scale

    start_x = (size - total_px_w) // 2
    start_y = (size - total_px_h) // 2

    _render_glyph(pixels, GLYPH_A,
                  start_x,
                  start_y,
                  scale, ACC_R, ACC_G, ACC_B)

    _render_glyph(pixels, GLYPH_G,
                  start_x + (glyph_cols + gap_units) * scale,
                  start_y,
                  scale, ACC_R, ACC_G, ACC_B)

    return _png_bytes(pixels)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    icons = [
        ("icon-192.png",     192, False),
        ("icon-512.png",     512, False),
        ("icon-maskable.png",512, True),
    ]

    for filename, size, maskable in icons:
        path = os.path.join(script_dir, filename)
        data = make_icon(size, maskable)
        with open(path, 'wb') as f:
            f.write(data)
        print(f"Created {path}  ({len(data):,} bytes, {size}x{size})")

    print("\nAll icons generated successfully.")

if __name__ == "__main__":
    main()
