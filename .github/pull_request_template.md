## What changed, and why

<!-- The why matters more than the what. If this fixes a trap, name the trap. -->

## How it was verified

<!-- Tick what you ran. Say plainly what you did not run and why. -->

- [ ] `npm run typecheck` — clean
- [ ] `npm run build:web` — exports without errors
- [ ] `npm run screenshots` — re-captured, and the regenerated PNGs are in this PR
- [ ] Driven by hand against a build, not just reasoned about
- [ ] Not applicable to what I changed, because: <!-- say why -->

Platforms actually exercised:

- [ ] Browser build
- [ ] iOS
- [ ] Android

## The honesty check

- [ ] Nothing in this change describes a feature that does not work — paywall lines, FAQ answers, the landing page, the store listing and the README included
- [ ] No sample or invented data was added to the app
- [ ] Any phone frame in this change came from `npm run screenshots`, and was not drawn or edited by hand
- [ ] Any number shown is derived from stored state rather than hard-coded

## Housekeeping

- [ ] `src/theme.ts`, `landing/styles.css` and `brand.md` agree, if this touched the palette or type
- [ ] `index.html` and its `FAQPage` structured data agree, if this touched an FAQ answer
- [ ] No `expo` / `expo-font` / `@expo/vector-icons` version was moved on its own
- [ ] No secrets, tokens or `.env` files are included
