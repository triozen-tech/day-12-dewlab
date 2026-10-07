"""Matte pass for the dry-skin still (Day 12): makes raw/skin-before.jpg read dull and dry next to the dewy
raw/skin-after.jpg, without moving pores.

RUN (from the repo root): python3 scripts/matte_skin.py
  in:  raw/skin-before-raw.jpg (the untouched Nano Banana edit) + raw/skin-after.jpg (texture for the watermark fill)
  out: raw/skin-before.jpg (overwritten)

Steps: paint out the Gemini sparkle mark (bottom right) → compress the bright base and the glossy detail peaks
(pore shadows kept) → slightly lower mid-scale clarity → desaturate ~10 % → soft uneven ashy blotches → keep the
overall brightness → one uniform sub-pixel shift to align with skin-after.jpg (measured −1.63 / −0.35 px).
Only tone, highlights and colour change; no warp, no blur of fine detail. Needs numpy + Pillow only."""
import numpy as np
from PIL import Image, ImageFilter

src = np.asarray(Image.open("raw/skin-before-raw.jpg").convert("RGB")).astype(np.float32) / 255
ref = np.asarray(Image.open("raw/skin-after.jpg").convert("RGB")).astype(np.float32) / 255
H, W, _ = src.shape

def _box(a, k, axis):
    """Box filter of odd width k along one axis (edge-padded), via cumulative sums."""
    pad = k // 2
    widths = [(0, 0)] * a.ndim
    widths[axis] = (pad + 1, pad)
    c = np.cumsum(np.pad(a, widths, mode="edge"), axis=axis, dtype=np.float64)
    hi = np.take(c, np.arange(k, c.shape[axis]), axis=axis)
    lo = np.take(c, np.arange(0, c.shape[axis] - k), axis=axis)
    return ((hi - lo) / k).astype(np.float32)


def blur(a, sigma):
    """Gaussian-like blur (three box passes per axis) of a float image (H,W) or (H,W,3)."""
    k = max(1, int(round(np.sqrt(12 * sigma * sigma / 3 + 1)))) | 1
    for axis in (0, 1):
        for _ in range(3):
            a = _box(a, k, axis)
    return a


# 1. paint out the Gemini sparkle mark (bottom right): smooth fill from the surroundings + A2's skin texture there
yy, xx = np.mgrid[0:H, 0:W]
mark = np.zeros((H, W), np.float32)
for cx, cy, r in ((2557, 1341, 62), (2639, 1423, 34)):
    mark = np.maximum(mark, ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r).astype(np.float32))
keep = 1 - mark
smooth = blur(src * keep[..., None], 40) / np.maximum(blur(keep, 40), 1e-4)[..., None]
texture = ref - blur(ref, 6)
fill = smooth + texture * 0.8
feather = blur(mark, 6)
feather = np.clip(feather * 1.6, 0, 1)
img = src * (1 - feather[..., None]) + fill * feather[..., None]

# 2. luminance split: big-scale base + fine detail (pores live in the detail and are kept)
lum = img @ np.array([0.2126, 0.7152, 0.0722], np.float32)
base = blur(lum, 45)
detail = lum - base

# 3. flatten the specular: soft-knee compress the bright base, and cut positive (glossy) detail peaks in bright areas
knee = 0.56
base2 = np.where(base > knee, knee + (base - knee) * 0.42, base)
bright = np.clip((base - 0.40) / 0.25, 0, 1)
gloss = np.clip(detail, 0, None)
detail2 = detail - gloss * (0.12 + 0.38 * bright)          # sparkle speckles go, pore shadows (negative detail) stay
# 4. a little less clarity: soften mid-scale local contrast only (radius 12 px), fine pores untouched
mid = blur(detail2, 12)
detail3 = detail2 - mid * 0.12
lum2 = base2 + detail3
scale = np.clip(lum2 / np.maximum(lum, 1e-4), 0, 1.2)
out = img * scale[..., None]

# 5. desaturate ~10 %
grey = (out @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
out = grey + (out - grey) * 0.90

# 6. slight uneven, ashy tone: low-frequency blotches pull toward a lighter, cooler grey-beige
rng = np.random.default_rng(12)
noise = Image.fromarray((rng.random((9, 16)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
blot = np.asarray(noise).astype(np.float32) / 255
blot = np.clip((blot - 0.45) / 0.55, 0, 1) ** 1.5
# ash = the skin's own colour half-way to grey, a touch lighter: dull, not lavender
ash = (out * 0.5 + grey * 0.5) * 1.05 + 0.015
out = out * (1 - 0.07 * blot[..., None]) + ash * (0.07 * blot[..., None])
# keep the overall brightness close to the original (dry skin is duller, not darker)
out = out * (lum.mean() * 0.96 / (out @ np.array([0.2126, 0.7152, 0.0722], np.float32)).mean())

# 7. align to A2: the edit came back shifted ~1.6 px right / 0.35 px down; one uniform sub-pixel shift (no warp)
DX, DY = -1.63, -0.35
pil = [Image.fromarray(np.clip(out[..., c] * 255, 0, 255).astype(np.float32), mode="F").transform((W, H), Image.AFFINE, (1, 0, -DX, 0, 1, -DY), resample=Image.BICUBIC) for c in range(3)]
out = np.stack([np.asarray(c) / 255 for c in pil], -1)

Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).save("raw/skin-before.jpg", quality=95, subsampling=0)
print("saved raw/skin-before.jpg", W, H)
