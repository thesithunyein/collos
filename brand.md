# Brand — Collos

_Status: active_

## Direction

Calm, trustworthy, and quietly optimistic. Collos should feel like a reliable shared notebook for everyday care: warm without being sentimental, clear without being clinical.

## Palette

- **Collos blue:** `#2457F5` — primary action and moments of reassurance
- **Ink:** `#15243D` — headings and high-emphasis text
- **Muted slate:** `#66758F` — supporting copy
- **Soft cloud:** `#F5F7FB` — app background
- **Backdrop:** `#E4E9F4` — surround behind the centred app frame on wide screens
- **White:** `#FFFFFF` — cards and elevated surfaces
- **Semantic green:** `#41A77A` — completed care moments
- **Semantic orange:** `#F19B3B` — gentle attention state
- **Semantic red:** `#C75353` — recoverable errors only

## Logo

The mark is a hand-drawn white cat's face with sparkly eyes, blush, and a heart
tag, on a soft periwinkle rounded square. Two source files, both committed
exactly as supplied:

- `assets/logo-source.png` — transparent background (README, splash mark)
- `assets/favicon-source.png` — the periwinkle square (app header, browser tab, app icon)

`assets/make-icons.py` only ever *resamples* those two files; it never draws the
mark. That is deliberate — the generator it replaced could regenerate the old
placeholder heart over the real logo. Run `python assets/make-icons.py` after
changing a source so every surface (app icon, adaptive icon, tab icon, landing
header) agrees.

## Landing page skin

The site's action blue (`#2F63D6`) is a lighter sibling of the app's `#2457F5`,
and the rest of its supporting palette is read straight off the logo: navy
`#183468` for headings, periwinkle `#9ABFF3` / `#D5E3FB` for washes, and coral
`#DD6B6B` for accents. A few pastel sparkle dots in the hero echo the confetti
scattered around the cat, and they are hidden on small screens.

## Typography

Use the platform sans-serif stack with generous line-height. Headings are compact and confident; body copy is short, specific, and easy to scan on a 375px viewport.

## Voice

Use active, human language: “Confirm a moment,” “Share the small things,” and “A little goes a long way.” Never make medical claims, give dosage recommendations, or imply that Collos replaces a clinician.
