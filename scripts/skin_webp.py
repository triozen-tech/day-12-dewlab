"""Before/after skin images for the site (Day 12).
RUN (from the repo root): python3 scripts/skin_webp.py
  in:  raw/skin-before.jpg (matte pass, scripts/matte_skin.py) + raw/skin-after.jpg   (pixel-aligned pair)
  out: public/images/dewlab/skin-before.webp + skin-after.webp (1920×1080, one shared crop: stays pixel-aligned)
Day 28 gets: its low-frequency tone evened out (the photo's big brown shadow patches flattened, pores + beads kept),
a little more exposure, and a soft glow from its wet highlights. Only tone changes, no pixel moves. numpy + Pillow."""
import numpy as np
from PIL import Image, ImageFilter

X, Y, W, H = 120, 80, 2000, 1125  # shared crop: keeps the highlight + beads, drops the dark right edge
Y709 = np.array([0.2126, 0.7152, 0.0722], np.float32)

def _box(a, k, axis):
    pad = k // 2; w = [(0, 0)] * a.ndim; w[axis] = (pad + 1, pad)
    c = np.cumsum(np.pad(a, w, mode="edge"), axis=axis, dtype=np.float64)
    return ((np.take(c, np.arange(k, c.shape[axis]), axis=axis) - np.take(c, np.arange(0, c.shape[axis] - k), axis=axis)) / k).astype(np.float32)

def blur(a, s):
    k = max(1, int(round(np.sqrt(4 * s * s + 1)))) | 1
    for ax in (0, 1):
        for _ in range(3):
            a = _box(a, k, ax)
    return a

bef = Image.open("raw/skin-before.jpg").convert("RGB").crop((X, Y, X + W, Y + H))
a = np.asarray(Image.open("raw/skin-after.jpg").convert("RGB").crop((X, Y, X + W, Y + H))).astype(np.float32) / 255

# 1) even out the low-frequency tone: divide by the very soft shading, put back a much flatter version of it
lum = a @ Y709
shade = blur(lum, 140)                                   # only the big patches (pores and beads are far smaller)
target = shade.mean() + (shade - shade.mean()) * 0.25    # keep 25 % of the big shading so it still reads as a cheek
a = np.clip(a * (target / np.maximum(shade, 1e-3))[..., None], 0, 1)
# 2) a little more exposure + a soft glow from the wet highlights (screen: light only added)
lum = a @ Y709
lift = np.clip(a * 1.05 + 0.012, 0, 1)
hi = np.clip((lum - 0.55) / 0.35, 0, 1)[..., None]
bloom = np.asarray(Image.fromarray(np.clip(a * hi * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(18))).astype(np.float32) / 255
out = 1 - (1 - lift) * (1 - 0.2 * bloom)

bef.resize((1920, 1080), Image.LANCZOS).save("public/images/dewlab/skin-before.webp", "WEBP", quality=84, method=6)
Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).resize((1920, 1080), Image.LANCZOS).save("public/images/dewlab/skin-after.webp", "WEBP", quality=84, method=6)
s0 = blur(np.asarray(Image.open("raw/skin-after.jpg").convert("L").crop((X, Y, X + W, Y + H))).astype(np.float32), 140)
s1 = blur((out @ Y709) * 255, 140)
print(f"Day 28 big-patch tone spread (std of the soft shading): {s0.std():.1f} → {s1.std():.1f} grey levels")
