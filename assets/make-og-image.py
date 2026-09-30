#!/usr/bin/env python3
"""Build the social preview card (`landing/og.png`) from the real app capture.

Why this exists
---------------
The link preview for collos.sithunyein.com used to be `app-dashboard.png`: a
780x1688 portrait phone screenshot served to a `summary_large_image` card, which
crops to roughly 2:1. Every judge who pastes the URL into a chat or a submission
form saw the middle 40% of a phone screen with no name on it — the first thing
they would see of Collos was an unlabelled crop of it.

This script composes the 1200x630 card those cards actually want: the brand
gradient the landing hero uses, the wordmark, one sentence, and the *real*
capture inside a navy bezel — the same bezel the app draws around itself in the
browser. The capture comes from `npm run screenshots`, so the card cannot show a
screen the product does not have.

Run it from the repository root:

    python assets/make-og-image.py

Deliberately dependency-light: Pillow only. The two fonts are Segoe UI, which is
present on every Windows machine this project is built on; elsewhere it falls
back to the fonts Pillow ships with, so the script runs anywhere.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CAPTURE = ROOT / "landing" / "app-dashboard.png"
MARK = ROOT / "assets" / "logo-mark.png"
OUT = ROOT / "landing" / "og.png"

WIDTH, HEIGHT = 1200, 630
# The hero panel's own three stops, read straight out of styles.css:
# #4f8ef2 -> #2f63d6 -> #1b3f96 at 0%, 54%, 100%.
STOPS = (
    (0.00, (0x4F, 0x8E, 0xF2)),
    (0.54, (0x2F, 0x63, 0xD6)),
    (1.00, (0x1B, 0x3F, 0x96)),
)
INK = (0x0F, 0x24, 0x50)
WHITE = (0xFF, 0xFF, 0xFF)
BLUE_TINT = (0xC9, 0xDB, 0xFA)
PERIWINKLE = (0x9A, 0xBF, 0xF3)

FONT_CANDIDATES = {
    "bold": [
        "C:/Windows/Fonts/segoeuib.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "regular": [
        "C:/Windows/Fonts/segoeui.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
}

# Where the phone sits, and how tall it is. Both are used by the layout check at
# the end, so the numbers exist once.
PHONE_HEIGHT = 552
PHONE_BEZEL = 11
PHONE_RIGHT = 96
TEXT_LEFT = 96


def load_font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    for candidate in FONT_CANDIDATES[kind]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    raise SystemExit("No %s font found. Tried:\n  %s" % (kind, "\n  ".join(FONT_CANDIDATES[kind])))


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def colour_at(t: float) -> tuple[int, int, int]:
    for index in range(1, len(STOPS)):
        previous_stop, previous_colour = STOPS[index - 1]
        stop, stop_colour = STOPS[index]
        if t <= stop:
            span = stop - previous_stop
            return lerp(previous_colour, stop_colour, 0.0 if span == 0 else (t - previous_stop) / span)
    return STOPS[-1][1]


def gradient() -> Image.Image:
    """The hero's gradient, run left to right: light at the type, deep at the phone.

    A 1px-tall ramp stretched to the card, rather than a per-pixel loop — the
    ramp is exact either way, and this stays instant.
    """
    ramp = Image.new("RGB", (512, 1))
    pixels = ramp.load()
    for x in range(512):
        pixels[x, 0] = colour_at(x / 511)
    return ramp.resize((WIDTH, HEIGHT), Image.BILINEAR)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255
    )
    return mask


def main() -> int:
    for required in (CAPTURE, MARK):
        if not required.exists():
            print(
                "missing %s — run `npm run screenshots` first" % required.relative_to(ROOT),
                file=sys.stderr,
            )
            return 1

    card = gradient()
    draw = ImageDraw.Draw(card)

    # The capture inside its bezel, at the app frame's own corner proportion.
    capture = Image.open(CAPTURE).convert("RGB")
    inner_width = round(capture.width * PHONE_HEIGHT / capture.height)
    screen = capture.resize((inner_width, PHONE_HEIGHT), Image.LANCZOS)
    bezelled = Image.new(
        "RGB", (inner_width + PHONE_BEZEL * 2, PHONE_HEIGHT + PHONE_BEZEL * 2), INK
    )
    bezelled.paste(screen, (PHONE_BEZEL, PHONE_BEZEL))
    phone_mask = rounded_mask(bezelled.size, round(bezelled.width * 0.115))
    phone_x = WIDTH - bezelled.width - PHONE_RIGHT
    phone_y = (HEIGHT - bezelled.height) // 2

    # One soft shadow, cast a little below the phone so it reads as standing on
    # the gradient rather than pasted onto it.
    shadow = Image.new("L", (WIDTH, HEIGHT), 0)
    shadow.paste(phone_mask, (phone_x, phone_y + 18))
    shadow = shadow.filter(ImageFilter.GaussianBlur(26))
    card.paste(Image.new("RGB", (WIDTH, HEIGHT), (0x08, 0x18, 0x36)), (0, 0), shadow)
    card.paste(bezelled, (phone_x, phone_y), phone_mask)

    # The mark, rounded the way the app rounds it: the file's own alpha and the
    # rounded rectangle, multiplied, so a transparent corner stays transparent.
    mark = Image.open(MARK).convert("RGBA").resize((88, 88), Image.LANCZOS)
    mark_alpha = ImageChops.multiply(rounded_mask((88, 88), 26), mark.split()[3])
    card.paste(mark.convert("RGB"), (TEXT_LEFT, 92), mark_alpha)

    wordmark = load_font("bold", 54)
    headline = load_font("bold", 62)
    subhead = load_font("regular", 27)
    footnote = load_font("regular", 22)

    draw.text((TEXT_LEFT + 104, 106), "collos", font=wordmark, fill=WHITE)
    draw.text((TEXT_LEFT, 250), "Care, together.", font=headline, fill=WHITE)
    draw.text((TEXT_LEFT, 336), "Check-ins, water breaks and shared", font=subhead, fill=BLUE_TINT)
    draw.text((TEXT_LEFT, 376), "notes in one calm daily plan.", font=subhead, fill=BLUE_TINT)
    draw.text((TEXT_LEFT, 470), "Free to start · No account needed", font=footnote, fill=PERIWINKLE)

    # Nothing may run into the phone's column. The type is authored to end well
    # short of it, and this proves that rather than trusting the numbers above.
    limit = phone_x - 32
    for text, font in (
        ("Care, together.", headline),
        ("Check-ins, water breaks and shared", subhead),
        ("notes in one calm daily plan.", subhead),
    ):
        right = draw.textbbox((TEXT_LEFT, 0), text, font=font)[2]
        if right > limit:
            print("text runs into the phone: %d > %d for %r" % (right, limit, text), file=sys.stderr)
            return 1

    card.save(OUT, optimize=True)
    print(
        "wrote %s  %dx%d  %d kB"
        % (OUT.relative_to(ROOT), WIDTH, HEIGHT, OUT.stat().st_size // 1024)
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
