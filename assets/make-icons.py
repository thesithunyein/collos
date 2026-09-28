#!/usr/bin/env python3
"""Generate the Collos app icon set from the logo.

Run from anywhere:  python assets/make-icons.py

Single source of truth: `logo-source.png` — the exact image supplied as the
Collos logo, committed byte-for-byte. Every output (App Store icon, Android
adaptive foreground, favicons, splash mark) is a pure resample of it, so no
output can drift from the logo the brand actually uses.

The previous generator drew a heart from bezier segments. That file is gone on
purpose: as long as it existed, anyone re-running it would silently regenerate
the old mark over this one. Scaling can't do that — it can only ever reproduce
the source.

iOS masks its icons to a squircle and Android to a circle (often with the
foreground further cropped), so the logo is fitted inside the industry-standard
safe zones rather than pasted edge-to-edge. The raw source itself is committed
untouched for the README and the landing page, where nothing gets masked.

Requires Pillow (PIL).
"""

from __future__ import annotations

import os
from collections import deque

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(HERE, "logo-source.png")
# Full-bleed square variant on the blue background — used where an opaque,
# rounded-canvas favicon reads best (browser tabs, the app subdomain).
FAVICON_SOURCE = os.path.join(HERE, "favicon-source.png")

# Android adaptive icons: Google's published safe zone is a circle of 66dp
# diameter on a 108dp canvas — ~61% of the width. Anything outside it risks
# clipping under a circular mask, so the ears must fit inside 61%, not 66%.
ADAPTIVE_SAFE_ZONE = 0.61

# iOS masks to a squircle losing ~18% at the corners; a little margin keeps the
# ears off the mask edge on every device.
IOS_SAFE_ZONE = 0.88

# Browser tabs are tiny: keep a whisker of padding so the face never touches
# the rounded-rect edge at 16 px.
FAVICON_SAFE_ZONE = 0.92

SPLASH_SAFE_ZONE = 0.34  # splash shows mark + wordmark, so the mark stays small


def load_source() -> Image.Image:
    """The exact logo, never modified."""
    return Image.open(SOURCE).convert("RGBA")


def _largest_component_bbox(alpha: Image.Image) -> tuple[int, int, int, int]:
    """Bounding box of the biggest connected opaque region: the cat's head.

    The logo scatters small decorative sparkles around the face. For circular
    masks we fit the *head* to the safe zone and let sparkles bleed outward —
    exactly how adaptive icons are meant to use the outer band. BFS in pure
    Python is fine at this size (the source is 328×328).
    """
    w, h = alpha.size
    px = alpha.load()
    visited = bytearray(w * h)
    best_count, best_bbox = 0, (0, 0, w - 1, h - 1)
    for sy in range(h):
        for sx in range(w):
            if visited[sy * w + sx] or px[sx, sy] < 8:
                continue
            queue = deque([(sx, sy)])
            visited[sy * w + sx] = 1
            count = 0
            min_x, min_y, max_x, max_y = sx, sy, sx, sy
            while queue:
                x, y = queue.popleft()
                count += 1
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx] and px[nx, ny] >= 8:
                        visited[ny * w + nx] = 1
                        queue.append((nx, ny))
            if count > best_count:
                best_count, best_bbox = count, (min_x, min_y, max_x, max_y)
    return best_bbox


def fitted(
    source: Image.Image, size: int, safe_zone: float, shape: str = "rect"
) -> Image.Image:
    """Logo scaled so its art respects `safe_zone` of `size`, centred.

    `shape="rect"` fits the art's bounding box — right for squircle masks
    (iOS) and unmasked surfaces. `shape="circle"` fits the farthest pixel of
    the head to the safe-zone *radius* — right for Android's circular masks,
    where a bounding-box fit leaves the ears clipping the mask edge.
    """
    alpha = source.split()[3]
    if shape == "circle":
        head_bbox = _largest_component_bbox(alpha)
        art = source.crop(head_bbox)
        # Farthest opaque pixel of the head from the crop centre.
        art_alpha = art.split()[3]
        w, h = art_alpha.size
        px = art_alpha.load()
        centre_x, centre_y = w / 2.0, h / 2.0
        max_radius = 0.0
        for y in range(h):
            for x in range(w):
                if px[x, y] >= 8:
                    distance = ((x - centre_x) ** 2 + (y - centre_y) ** 2) ** 0.5
                    if distance > max_radius:
                        max_radius = distance
        scale = (size * safe_zone / 2.0) / max_radius
    else:
        left, top, right, bottom = alpha.getbbox()
        art = source.crop((left, top, right, bottom))
        art_max = max(art.size)
        scale = (size * safe_zone) / art_max

    new_w, new_h = round(art.size[0] * scale), round(art.size[1] * scale)
    art = art.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(art, ((size - new_w) // 2, (size - new_h) // 2), art)
    return canvas


def make_icon(size: int = 1024) -> Image.Image:
    """Full-bleed iOS / App Store icon. Black canvas (the logo's own), opaque."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    logo = fitted(load_source(), size, IOS_SAFE_ZONE)
    canvas.alpha_composite(logo)
    return canvas.convert("RGB")


def make_adaptive_foreground(size: int = 1024) -> Image.Image:
    """Android adaptive foreground: head inside the circular safe zone."""
    return fitted(load_source(), size, ADAPTIVE_SAFE_ZONE, shape="circle")


def make_favicon(size: int = 196) -> Image.Image:
    """Browser-tab favicon: resampled straight from `favicon-source.png`.

    That source is the supplied full-bleed square variant (cat on blue), so the
    favicon is the same artwork everywhere with no fitting decisions of its own.
    """
    source = Image.open(FAVICON_SOURCE).convert("RGBA")
    return source.resize((size, size), Image.LANCZOS)


def make_splash(size: int = 1024) -> Image.Image:
    """Transparent splash mark sized to sit above a wordmark on #2457F5.

    The source art already has a transparent background and line-art styling,
    so it reads as a sticker on the brand blue with no recolouring.
    """
    return fitted(load_source(), size, SPLASH_SAFE_ZONE)


def main():
    jobs = [
        ("icon.png", make_icon(1024)),
        ("adaptive-icon.png", make_adaptive_foreground(1024)),
        ("favicon.png", make_favicon(196)),
        ("splash.png", make_splash(1024)),
    ]
    for name, img in jobs:
        path = os.path.join(HERE, name)
        img.save(path, "PNG", optimize=True)
        print(f"{name:20} {img.size[0]}x{img.size[1]}  mode={img.mode}")

    # The landing page's tab icon is a copy: one logo everywhere.
    landing_favicon = os.path.join(HERE, "..", "landing", "favicon.png")
    jobs[2][1].save(landing_favicon, "PNG", optimize=True)
    print(f"{'landing/favicon.png':20} {jobs[2][1].size[0]}x{jobs[2][1].size[1]}  mode={jobs[2][1].mode}")


if __name__ == "__main__":
    main()
