"""Blender turntable PNGs → WebP for the shop (Day 12).
RUN (from the repo root): python3 scripts/turntable_webp.py <product> [<product> …]
  in:  raw/blender/turntable/<product>/NN.png (720², transparent)   out: public/images/dewlab/turntable/<product>/NN.webp
Needs Pillow only."""
import sys
from pathlib import Path
from PIL import Image

for key in sys.argv[1:]:
    src = Path("raw/blender/turntable") / key
    out = Path("public/images/dewlab/turntable") / key
    out.mkdir(parents=True, exist_ok=True)
    total = 0
    for png in sorted(src.glob("*.png")):
        im = Image.open(png).convert("RGBA").resize((640, 640), Image.LANCZOS)
        dst = out / (png.stem + ".webp")
        im.save(dst, "WEBP", quality=82, method=6, alpha_quality=90)
        total += dst.stat().st_size
    print(f"{key}: {len(list(src.glob('*.png')))} frames, {total / 1e6:.2f} MB")
