# Contributing to Collos

Thanks for looking. This file is short on ceremony and specific about the two
things that actually matter here: **run the checks**, and **do not describe
anything the code does not do**.

By taking part you agree to the [code of conduct](CODE_OF_CONDUCT.md).

## Before you start

For anything larger than a typo, open an issue first and say what you intend to
change and how you will verify it. Collos has a strong opinion about scope — see
"Rules this project holds itself to" below — and a five-minute conversation
upfront is cheaper than a rejected branch.

## Set up

```bash
git clone https://github.com/thesithunyein/collos.git
cd collos
npm install
npm run typecheck      # must be clean before you commit
npm start              # then press w for the browser build
```

You do **not** need RevenueCat keys, a store account or an Apple/Google developer
account to work on the app. With no keys set, the purchase flow runs in **preview**
mode: every screen is reachable and the UI says plainly that no payment is taken.
That is the intended contributor experience, not a degraded one.

## The verification contract

A pull request is not ready until all of these are true. They are the same checks
CI runs ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)), so there are no
surprises at review time.

| Check | Command | What it catches |
| --- | --- | --- |
| Types | `npm run typecheck` | A broken import, a wrong prop, a state shape that drifted |
| Browser bundle | `npm run build:web` | A dependency that resolves on native but not on web — the single most common failure in this codebase |
| Screens | `npm run screenshots` | A screen whose layout changed enough that the captured PNGs no longer match the app |
| Docs | `npm run docs:check` | A file path, in-page anchor, Mermaid node or JSON sample in the README that no longer matches the repository |

If your change is visible on screen, re-run the capture script and commit the
regenerated PNGs with it. They are not build output that can be regenerated later;
they are the images the landing page and the store listings serve, and a stale one
is the exact drift this project has already shipped once:

```bash
npm run screenshots            # landing/ — the frames the site shows
npm run screenshots:devpost    # submission/screenshots/ — 1179x2556
npm run screenshots:appstore   # store/screenshots/appstore/ — 1320x2868
npm run screenshots:playstore  # store/screenshots/playstore/ — 1080x1920
```

`npm test` runs the behaviour suite in `tests/` — Node's built-in runner, no new
dependencies. If your change adds behaviour to `src/storage/careStore.ts`, extend
the suite in the same commit: name the behaviour in the test title, and run the
real source through `tests/support/load-ts.mjs` rather than a copy of it. A test
that needs the React screens is a different project; this suite tests state, not
pixels.

## Rules this project holds itself to

These are not style preferences. They are the reason the repository looks the way
it does, and a pull request that breaks one will be asked to change even if it is
otherwise good.

1. **Nothing may be described that the code cannot do.** The paywall, the FAQ, the
   store listing and this repository must all describe shipped behaviour. Features
   that were advertised before they existed were removed deliberately; re-adding a
   line is part of shipping the feature it names, not a separate task.
2. **The app contains no sample data.** Nothing invents a plan for the user. Setup
   creates the first person and the day starts genuinely empty.
3. **Captures are generated, never drawn.** Every phone frame on the site comes
   from `npm run screenshots` against the running app. Do not hand-edit a PNG and
   do not hand-build a mockup of a screen that exists.
4. **No medical claims.** Collos coordinates care. It does not diagnose, dose,
   remind anyone to take medication, or replace a clinician. This is a safety
   boundary and an App Store one.
5. **Derived numbers stay derived.** A progress ring, a stat and a count all read
   from stored state. A hard-coded "2 of 4" is a bug even when it is correct the
   day it is written.
6. **Something that is not finished says so.** No "coming soon" dressed up as a
   feature, and no honest gap quietly deleted — the shared circle between phones
   is not built, and the site and the app both say that out loud.

## House style

- **Comments explain why, not what.** The code says what it does. If a comment
  only restates the line beneath it, delete it. If a comment records a trap that
  cost an afternoon, keep it — several of the best comments here are that.
- **British spelling** in prose, comments and copy (`colour`, `centralise`).
- **Sentence case** in UI copy, no uppercase micro-labels.
- **One visual language.** The app and the landing site share one palette and one
  type family on purpose, so a capture of the app can sit inside the page that
  describes it. If you change `src/theme.ts`, check `landing/styles.css` and
  `brand.md` in the same change.
- **Keep the dependencies small.** This project runs on eleven runtime dependencies
  and has no state library and no UI kit — the test suite uses Node's built-in
  runner and adds none. Adding one needs a reason in the pull request.

## Commits and pull requests

- One change per commit, and a commit message that explains the **why**. If the
  change fixes a trap, name the trap.
- In the pull request, say what you changed, what you ran, and what you did
  **not** verify. "I could not test on a real Android device" is a useful thing to
  read; silence is not.
- Do not bump `expo`, `expo-font` or `@expo/vector-icons` on their own. They move
  together or the web build breaks at runtime with a blank page — see
  [`docs`](landing/docs.html) for that trap and the others.
