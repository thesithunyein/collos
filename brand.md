# Brand — Collos

_Status: active_

## Direction

Calm, trustworthy, and quietly optimistic. Collos should feel like a reliable shared notebook for everyday care: warm without being sentimental, clear without being clinical.

## Palette

Every value below is read off the logo, and the app and the landing site use the
same ones so the phone frames on the site match the app they show.

- **Collos blue:** `#2F63D6` — primary action and moments of reassurance
- **Ink navy:** `#183468` — headings and high-emphasis text (the cat's outline)
- **Periwinkle:** `#9ABFF3` — the logo's own square, for fills on brand blue
- **Blush:** `#DD6B6B` — the coral of the heart on the cat's tag
- **Muted slate:** `#5D7099` — supporting copy
- **Soft cloud:** `#F3F7FE` — app background
- **Backdrop:** `#EDF3FE` — surround behind the device frame on wide screens
- **White:** `#FFFFFF` — cards and elevated surfaces
- **Semantic mint:** `#4FA98A` — completed care moments
- **Lilac:** `#7B76DE` — the fourth moment tone, kept distinct from the blues
- **Semantic red:** `#C75353` — recoverable errors only

`src/theme.ts` is the single source for the app; `landing/styles.css` repeats the
same values as CSS variables. Keep both files, and this list, in step.
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

The site runs on the same palette as the app, so the two phone frames shown in the
hero carry the exact colours of the app they display. Its layout adds one flourish
the mark suggests: a few pastel sparkle dots in the hero that echo the confetti
scattered around the cat, hidden on small screens.

## Typography

Use the platform sans-serif stack with generous line-height. Headings are compact and confident; body copy is short, specific, and easy to scan on a 375px viewport.

## Voice

Use active, human language: “Confirm a moment,” “Share the small things,” and “A little goes a long way.” Never make medical claims, give dosage recommendations, or imply that Collos replaces a clinician.
