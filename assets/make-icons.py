#!/usr/bin/env python3
"""Generate the Collos app icon set from a single vector definition.

Run from anywhere:  python assets/make-icons.py

Everything is derived from HEART_SEGMENTS below, so the exported PNGs, the
Android adaptive foreground, the favicon, the splash mark and assets/logo.svg
can never drift apart. Colours come from brand.md.

Requires Pillow (PIL).
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFont

# --- Brand (see brand.md) ---------------------------------------------------
BLUE = (36, 87, 245)  # #2457F5
BLUE_DARK = (23, 61, 186)  # #173DBA
WHITE = (255, 255, 255)

SUPERSAMPLE = 4  # draw big, downscale with LANCZOS for clean edges
HERE = os.path.dirname(os.path.abspath(__file__))

# --- The mark --------------------------------------------------------------
# Heart silhouette in a 1000x1000 design box as chained cubic beziers.
# Start point first, then each segment's two control points and its end point.
HEART_SEGMENTS = [
    ((500, 810), (240, 620), (90, 470), (90, 330)),
    ((90, 330), (90, 205), (185, 120), (300, 120)),
    ((300, 120), (400, 120), (470, 180), (500, 250)),
    ((500, 250), (530, 180), (600, 120), (700, 120)),
    ((700, 120), (815, 120), (910, 205), (910, 330)),
    ((910, 330), (910, 470), (760, 620), (500, 810)),
]

# Bounding box of the design above, used for optical centring.
BOX_L, BOX_R, BOX_T, BOX_B = 90.0, 910.0, 120.0, 810.0
BOX_CX = (BOX_L + BOX_R) / 2.0
BOX_CY = (BOX_T + BOX_B) / 2.0
BOX_W = BOX_R - BOX_L
BOX_H = BOX_B - BOX_T


def cubic_points(p0, p1, p2, p3, steps=96):
    """Sample a cubic bezier into a polyline."""
    out = []
    for i in range(steps + 1):
        t = i / steps
        mt = 1.0 - t
        x = (
            mt**3 * p0[0]
            + 3 * mt * mt * t * p1[0]
            + 3 * mt * t * t * p2[0]
            + t**3 * p3[0]
        )
        y = (
            mt**3 * p0[1]
            + 3 * mt * mt * t * p1[1]
            + 3 * mt * t * t * p2[1]
            + t**3 * p3[1]
        )
        out.append((x, y))
    return out


def heart_polygon(
    canvas: int, width_ratio: float, centre_ratio: float = 0.5
) -> list[tuple[float, float]]:
    """Heart outline scaled to `width_ratio` of `canvas`, optically centred.

    The design box centre maps to the canvas centre, so the heart reads as
    centred rather than sitting low inside its own bounding box.
    `centre_ratio` moves that optical centre up or down the canvas.
    """
    scale = (canvas * width_ratio) / BOX_W
    cx = canvas / 2.0
    cy = canvas * centre_ratio

    points: list[tuple[float, float]] = []
    for segment in HEART_SEGMENTS:
        points.extend(cubic_points(*segment)[:-1])

    return [
        (cx + (x - BOX_CX) * scale, cy + (y - BOX_CY) * scale) for x, y in points
    ]


def vertical_gradient(size: int, top: tuple, bottom: tuple) -> Image.Image:
    """Top-to-bottom linear gradient."""
    img = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(1, size - 1)
        draw.line(
            [(0, y), (size - 1, y)],
            fill=tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)),
        )
    return img


def radial_glow(size: int, radius_ratio: float, peak_alpha: int) -> Image.Image:
    """Soft ambient glow: brightest at the centre, fading smoothly to nothing.

    Drawn largest-first so each pixel ends up with the alpha of the smallest
    disc covering it, which yields a clean radial falloff with no visible edge.
    """
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    centre = size / 2.0
    r_max = size * radius_ratio
    steps = 180
    for i in range(steps, 0, -1):
        t = i / steps  # 1 at the outer edge, approaching 0 at the centre
        alpha = round(peak_alpha * (1.0 - t) ** 1.8)
        if alpha <= 0:
            continue
        r = r_max * t
        draw.ellipse(
            [centre - r, centre - r, centre + r, centre + r],
            fill=(255, 255, 255, alpha),
        )
    return layer


def downscale(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)


def draw_mark(layer: Image.Image, canvas: int, width_ratio: float, centre_ratio=0.5):
    """Fill the heart onto `layer`, which is already at supersampled scale."""
    draw = ImageDraw.Draw(layer)
    draw.polygon(heart_polygon(canvas, width_ratio, centre_ratio), fill=WHITE)


# --- Outputs ---------------------------------------------------------------
def make_icon(size: int = 1024) -> Image.Image:
    """Full-bleed iOS/App Store icon. Opaque, no alpha channel."""
    big = size * SUPERSAMPLE
    img = vertical_gradient(big, BLUE, BLUE_DARK)

    # Soft glow, echoing the halo behind the onboarding artwork.
    img = Image.alpha_composite(
        img.convert("RGBA"), radial_glow(big, radius_ratio=0.42, peak_alpha=30)
    )

    mark = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_mark(mark, big, 0.60)
    img = Image.alpha_composite(img, mark)

    return downscale(img.convert("RGB"), size)


def make_adaptive_foreground(size: int = 1024) -> Image.Image:
    """Android adaptive icon foreground: transparent, inside the safe zone."""
    big = size * SUPERSAMPLE
    mark = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_mark(mark, big, 0.54)  # Android masks/crops, so stay well inside
    return downscale(mark, size)


def make_favicon(size: int = 196) -> Image.Image:
    """Rounded-square favicon that reads well in a browser tab."""
    big = size * SUPERSAMPLE
    base = vertical_gradient(big, BLUE, BLUE_DARK).convert("RGBA")
    base = Image.alpha_composite(base, radial_glow(big, 0.46, 28))

    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=255
    )
    rounded = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    rounded.paste(base, (0, 0), mask)

    mark = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_mark(mark, big, 0.62)
    return downscale(Image.alpha_composite(rounded, mark), size)


def _bold_font(px: int):
    """Best available bold sans for the splash wordmark."""
    for name in ("segoeuib.ttf", "arialbd.ttf", "calibrib.ttf", "DejaVuSans-Bold.ttf"):
        for root in (os.path.join(os.environ.get("WINDIR", ""), "Fonts"), ""):
            try:
                return ImageFont.truetype(os.path.join(root, name), px)
            except OSError:
                continue
    return ImageFont.load_default()


def make_splash(size: int = 1024) -> Image.Image:
    """Transparent splash mark, drawn on the #2457F5 splash background."""
    big = size * SUPERSAMPLE
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))

    # Heart sits in the upper half; the wordmark is placed below it with a
    # deliberate gap, so the tip of the heart never touches the text.
    heart_width, heart_centre = 0.40, 0.44
    draw_mark(layer, big, heart_width, heart_centre)

    heart_bottom = big * heart_centre + (BOX_H / 2.0) * (big * heart_width / BOX_W)
    text_top = heart_bottom + big * 0.048

    d = ImageDraw.Draw(layer)
    font = _bold_font(int(big * 0.095))
    d.text((big / 2.0, text_top), "collos", font=font, fill=WHITE, anchor="mt")
    return downscale(layer, size)


def make_svg() -> str:
    """Vector source built from the same bezier segments."""
    parts = [f"M {HEART_SEGMENTS[0][0][0]:g} {HEART_SEGMENTS[0][0][1]:g}"]
    for _, c1, c2, end in HEART_SEGMENTS:
        parts.append(
            f"C {c1[0]:g} {c1[1]:g} {c2[0]:g} {c2[1]:g} {end[0]:g} {end[1]:g}"
        )
    path = " ".join(parts) + " Z"

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!-- Collos mark. Generated by assets/make-icons.py - edit that file, not this one. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img" aria-label="Collos">
  <defs>
    <linearGradient id="collos-blue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2457F5" />
      <stop offset="1" stop-color="#173DBA" />
    </linearGradient>
    <radialGradient id="collos-glow" cx="0.5" cy="0.5" r="0.42">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.12" />
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1000" height="1000" fill="url(#collos-blue)" />
  <circle cx="500" cy="500" r="420" fill="url(#collos-glow)" />
  <path d="{path}" fill="#FFFFFF" />
</svg>
"""


def make_svg_mark() -> str:
    """Transparent-background variant for the landing page and docs."""
    parts = [f"M {HEART_SEGMENTS[0][0][0]:g} {HEART_SEGMENTS[0][0][1]:g}"]
    for _, c1, c2, end in HEART_SEGMENTS:
        parts.append(
            f"C {c1[0]:g} {c1[1]:g} {c2[0]:g} {c2[1]:g} {end[0]:g} {end[1]:g}"
        )
    path = " ".join(parts) + " Z"
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!-- Collos mark, transparent background. Generated by assets/make-icons.py. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img" aria-label="Collos">
  <path d="{path}" fill="#2457F5" />
</svg>
"""


def main():
    jobs = [
        ("icon.png", make_icon(1024), False),
        ("adaptive-icon.png", make_adaptive_foreground(1024), True),
        ("favicon.png", make_favicon(196), True),
        ("splash.png", make_splash(1024), True),
    ]
    for name, img, transparent in jobs:
        path = os.path.join(HERE, name)
        img.save(path, "PNG", optimize=True)
        print(f"{name:20} {img.size[0]}x{img.size[1]}  mode={img.mode}")

    for name, svg in (("logo.svg", make_svg()), ("logo-mark.svg", make_svg_mark())):
        with open(os.path.join(HERE, name), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(svg)
        print(f"{name:20} vector")


if __name__ == "__main__":
    main()
