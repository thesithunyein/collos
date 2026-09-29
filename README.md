# Collos

<p align="center">
  <img src="assets/logo-mark.png" alt="The Collos logo: a hand-drawn white cat's face with sparkling blue eyes and a heart tag, on a soft periwinkle rounded square." width="120" />
</p>

Collos is a mobile-first care coordination experience built with Expo and React Native. It helps a care circle share small, everyday moments of support without making medical claims.

**Platforms.** Collos is a native iOS and Android app — one identifier, `com.collos.app`, on both, built through EAS (`eas.json`), with native-storage code paths in `src/storage/`. The browser build at [app.collos.sithunyein.com](https://app.collos.sithunyein.com) is a second target of the **same** React Native codebase via `react-native-web`, not a separate web app. Settings → **This device** prints the platform, OS version, device, React Native runtime and app identifier read from whichever build is running, so the two are easy to tell apart.

<p align="center">
  <a href="https://app.collos.sithunyein.com"><strong>Open the live app</strong></a> · <a href="https://collos.sithunyein.com">Project site</a>
</p>

> **Safety note:** Collos is for care coordination only. It is not medical advice and does not replace a qualified care professional.

## Project brief

Collos is for the person in a family who has quietly become the organiser. Care work is invisible and easy to drop: one sibling does the morning call, another does the shopping, and nobody is sure what has actually been done. Collos turns that into a short, shared daily plan.

**Functional now:** onboarding, care-circle recipient switching, daily care-plan cards, confirmed/not-confirmed/skipped task states, loading and empty states, shared notes, **a real RevenueCat purchase flow** (offerings, purchase, restore, entitlement gating), an add-a-moment flow, device-local persistence, and three working tabs — Today, Circle, and Settings.

**What Pro actually sells:** one thing, enforced in code. The free plan keeps **one shared note a day per person** (`FREE_NOTES_PER_DAY` in `src/storage/careStore.ts`); Pro removes the cap. Every line on the paywall maps to a behaviour you can test on the paywall screen itself — nothing is listed that the app cannot do. Notes are written to the same device-local store as the plan, so a note survives a restart exactly like a confirmed moment does.

**Persistence:** the care plan survives restarts. Every confirmation, added moment, and recipient preference is written to device-local storage the moment it happens — `localStorage` on web, `expo-file-system` on native (`src/storage/`). No account, no backend, nothing leaves the device, which is exactly what the privacy policy and store listing claim. Settings has a reset that clears it.

**Still to build:** a backend so a care circle is shared *between* phones (the current store is per-device), scheduled reminders. The release path is in place: `eas.json` defines the build profiles, and `RELEASE.md` is the runbook from an empty RevenueCat project to a submitted store listing.

**Deliberately not advertised:** reminders and care-circle invites. The paywall and three screens used to sell "gentle reminders" with no notification code behind it, and invites stayed on the paywall after the shared circle was deferred to a backend. Every mention is now gone rather than left as a promise — a feature listed but absent is an App Store rejection, and it is the same drift that once left a stale dashboard mockup on the landing page. Re-add each line in the same change that ships the feature it names.

## Run locally

1. Install Node.js 18+ and Expo CLI prerequisites.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start Expo:

   ```bash
   npm start
   ```

4. Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go.

Type-check the app with:

```bash
npm run typecheck
```

## RevenueCat

Subscriptions run through [`react-native-purchases`](https://github.com/RevenueCat/react-native-purchases). Since SDK 9.7.6 the same SDK also covers React Native Web, so the app, the browser build, and the native builds share one entitlements system.

Copy `.env.example` to `.env` and fill in the public SDK keys from your RevenueCat project. All of them are `EXPO_PUBLIC_*` values, and all of them are public by design — never put a secret key here.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | App Store purchases |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Google Play purchases |
| `EXPO_PUBLIC_REVENUECAT_WEB_KEY` | Web purchases, billed through RevenueCat Billing (Stripe). Separate from the native keys. |
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` | Entitlement identifier that unlocks Pro. Must match the dashboard; the Collos project uses `collos_pro`, which is also the built-in fallback. |
| `EXPO_PUBLIC_REVENUECAT_PROJECT_ID` | The project id, `proj…`, from the dashboard URL. Shown in the app's Settings screen. |

In the dashboard you need: a project, a product per store, an entitlement named to match `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT`, and a **default** offering holding a monthly and an annual package.

### Preview mode

If no key is present for the current platform, the app runs in **preview** mode rather than failing: the purchase flow is fully walkable and the UI says plainly that no payment is taken. This keeps the public web demo working before a RevenueCat project exists. Nothing in `src/purchases/` throws — a broken store connection degrades to preview instead of taking the app down.

### Testing

`react-native-purchases` contains native code, so real purchases need a development build (`npx expo install expo-dev-client`, then `eas build`). Inside Expo Go the SDK falls back to JavaScript-level mocks, which is enough to check the UI and the entitlement logic. Restore purchases is not supported on the web at all, and the app says so instead of showing a confusing failure.

## Dependency versions

The app targets Expo SDK 51, so every Expo package must stay on its SDK 51 version. `expo-font` is pinned to `~12.0.10` and additionally guarded by an `overrides` entry in `package.json`, because `@expo/vector-icons` declares `expo-font` as a wildcard peer dependency: a floating range resolves it to the newest release, and a newer `expo-font` calls `registerWebModule`, which does not exist in SDK 51's `expo-modules-core`. The web bundle then builds successfully and throws at runtime, leaving a blank page. If you upgrade Expo, move `expo`, `expo-font`, and `@expo/vector-icons` together in one change.

`react-native-purchases` is pinned exactly for the same reason: its peers include `react-native-web: "*"`. Before and after adding it, `npm ls expo-modules-core expo-font react-native-web @expo/vector-icons` was checked and unchanged.

## Project shape

```
App.tsx                        app shell: stage, tab routing, nav, paywall, persistence wiring
src/theme.ts                   colour palette (mirrors brand.md)
src/storage/careStore.ts       device-local care-plan state: load, save, transitions
src/storage/fileStore*.ts      storage primitive per platform (localStorage / expo-file-system)
src/purchases/config.ts        platform key resolution, entitlement id, preview detection
src/purchases/revenuecat.ts    SDK wrapper: init, offerings, purchase, restore, error mapping
src/purchases/usePro.ts        the hook the UI consumes
src/components/                NavItem, TaskCard, PaywallModal, AddMomentSheet, NotesSheet
src/screens/                   Onboarding, Today, Circle, Settings
src/data/mockCare.ts           the built-in moment templates and recipients
```

- `src/data/mockCare.ts` now provides the *built-in* moment templates. User-added moments, shared notes and every status change live in `src/storage/careStore.ts`, on the device. A future backend replaces the storage module, not the UI.
- `src/purchases/` is the only place that imports the RevenueCat SDK, so the rest of the UI only ever sees plans and a `pro` boolean.
- The Pro entitlement gates real UI: the shared-notes cap is lifted when it is active, and both the Today strip and the Circle screen read the live count from storage. Settings exposes the app user ID, entitlement identifier, and project ID, which is what a reviewer needs to verify the integration.
- `.env.example` documents every environment variable. No secrets are committed.

## Deploy the Expo web app

The same Expo app exports a browser build without changing the native entry point:

```bash
npm install
npm run build:web
```

The repository-root `vercel.json` builds the web app into `dist/`. In Vercel, import this repository with the **Root Directory** set to `.` and the `Other` framework preset. The intended app domain is `https://app.collos.sithunyein.com`; add it under **Project Settings → Domains** and create the DNS record Vercel provides. If the custom domain is not attached yet, use the exact Vercel deployment URL shown in the project dashboard instead.

Web mode runs the full interaction flow. Web purchases bill through RevenueCat Billing, so a configured `EXPO_PUBLIC_REVENUECAT_WEB_KEY` makes the browser build take real subscriptions. Without that key the build stays in preview mode. Restore purchases is unavailable on the web and the app says so instead of failing silently.

## Public landing page

The static marketing site lives in `landing/` so it can deploy independently without changing the Expo app. It has no npm dependencies, no build step and needs no secrets: `index.html`, `docs.html`, `404.html` and the two legal pages are hand-written HTML against one stylesheet. Its only runtime requests are two Google Fonts stylesheets.

The site and the app share one visual system, which is what lets a capture of the running app sit inside the page that describes it without either looking borrowed:

| Rule | Where it is written down |
| --- | --- |
| One type family, DM Sans, at every weight, with display type on `clamp()` | `--display` / `--body` in `landing/styles.css` |
| Icons are Material Symbols Rounded — never an emoji or a typed glyph | `.material-symbols-rounded` in `landing/styles.css` |
| A surface is white paper: 1px hairline, `0 2px 12px` ink at 5%, lifting 3px on hover | `--hairline`, `--card-shadow`, `.card` in `landing/styles.css`; `elevation` in `src/theme.ts` |
| The action is a dark pill with a white circular chevron on the **left** | `.nav-cta`, `.button-glass` in `landing/styles.css` |
| Chrome is divided by a dashed rule, not a solid one | `.site-nav::after`, `.site-header`, `.site-footer` |
| Decoration moves: a 10px rise with a 3° tilt | `@keyframes floatSlow` |

The palette is deliberately *not* the reference's near-black. Text stays Collos navy (`#183468`) and the accent stays brand blue (`#2F63D6`), because the app, these captures, this README and the store listing all have to read as one product.

People are drawn as faces, not letters. `src/components/Avatar.tsx` renders a bundled portrait and falls back to initials only when there is no picture; `landing/avatars/` holds the site's copies of the three portraits. The lettered square it replaced was the one detail that made a finished screen read as a wireframe — a person does not have an initial for a face.

`landing/404.html` is self-contained on purpose: its own `<style>`, no `styles.css`, 100vh with no scrolling, and the same navbar as every other page. Vercel serves it for any unmatched path, which is why every asset and link inside it is root-absolute (`/docs`, `/logo-mark.png`) rather than relative — the file renders at whatever URL was missed, so `docs.html` would resolve to `/whatever/docs.html` and 404 all over again. Its decorations are the app's own cat (`pets`) and heart, not borrowed art.

The index and the docs page are the two halves of the pitch, and each section has a rule about what it may say:

| Surface | What it must match |
| --- | --- |
| `#how-it-works` | The three steps are the real flow; the little UI fragments are the app's own components, not invented art. |
| `#plans` | The prices and the free-tier limit are the live RevenueCat offering and `FREE_NOTES_PER_DAY`. Change one, change the other. |
| `#faq` | Every answer describes shipped behaviour, including the ones that admit a gap (no cross-device circle yet). Native `<details>` with `name="faq"`, so it works before the JavaScript loads. |
| `docs.html` | The architecture, the environment variables and the troubleshooting table must stay true to this README and to `RELEASE.md`. |

`docs.html` is the written half of the product: what the app is not, where the data lives, what Pro changes in code, how to run it locally, and the traps this project has already fallen into. `vercel.json` sets `cleanUrls`, so it is reachable at `/docs`, and the landing nav links there. The FAQ is also published as `FAQPage` structured data in `index.html`, which is why those two files have to be edited together.
The two phone previews are real captures of the running app (`landing/app-onboarding.png` and `landing/app-dashboard.png`), not hand-built CSS mockups. The cat logo at the top of this README is the source of truth for every icon: `python assets/make-icons.py` regenerates the App Store icon, the Android adaptive foreground, both favicons, and the splash mark from it. The site therefore cannot advertise a dashboard the app does not render: an earlier mockup kept claiming "50%" and "2 of 4 confirmed" months after the app showed 25% and 1 of 4. Re-capture them after any UI change so the two stay in sync:

```bash
npm run screenshots
```

The script launches a local Chrome or Edge headless, drives the web app over the DevTools protocol, and rewrites both PNGs in `landing/`. It has no npm dependencies and needs no secrets. Point it at a local build with `--base-url http://localhost:8081`, or set `CHROME_PATH` if Chrome is not installed in the usual location. `--only 04-paywall` runs the tour as far as the screenshots you name and writes only those, which is how the paywall shot is taken against the deployed app — the real RevenueCat offering loads there, and stopping before *Continue with Pro* keeps the tour out of a live checkout.

Two switches exist to keep a run against production from failing. `--skip-pro` drops the paywall *and* the Pro steps, because against the deployed app *Continue with Pro* hands off to the real RevenueCat Billing checkout, which a headless browser cannot finish; the tour would abort there and leave the Settings screenshot at whatever the previous build wrote. The paywall shot has to go with it: that step leaves the modal open, so the next step's *Settings* press would land on the scrim instead of the tab bar. Run it on its own with `--only 04-paywall`.

## Submission assets

```bash
npm run screenshots:devpost
```

That writes six screenshots to `submission/screenshots/` at **1179×2556** — the exact size Devpost asks for, with no device frame. It captures at 393×852 CSS pixels with a 3× device scale factor, so the output needs no resampling. The flow drives the real app through onboarding, the daily plan, the locked circle, the paywall, the unlocked circle, and Settings.

### Type is the thing that made it read as generated

The first version of this app set **51 styles at weight 800 and six at 900**, against two at 600, and put uppercase
letterspaced micro-labels on four different screens. That combination is the visual signature of a generated UI: every
element shouts at the same volume, so nothing has hierarchy and the eye finds no calm surface. It was the single most
reliable tell that the product was not hand-built, and no amount of correct behaviour fixed it.

The range is now 600 for row titles and labels, 700 for screen titles, numbers and the one hero card, and nothing above
it. The uppercase labels became sentence case (`Care circle`, `Members`, `Store connection`) with the tracking that
was tuned for capitals removed, and the oversized display sizes came down with them — screen titles 27 to 25, section
titles 20 to 18, the hero card title 22 to 19.

The other half of "this looks generated" is **density**, which is a product decision rather than a styling one. Today
carried a greeting, a switcher, a hero card, a section header with two actions, four moment cards each with *two* bordered
buttons, a notes row, a Pro row and a medical disclaimer — eight buttons on one screen, plus a control that wipes the day
sitting as a peer of the one button people actually press. Four things moved or went:

| Was on Today | Where it is now |
| --- | --- |
| A second bordered button, `Skip`, on every moment card | An icon-only control pinned to the card's trailing edge. The action is unchanged and still announced to a screen reader; only the chrome went |
| `Reset day`, beside `Add` | Settings, under "Your data", directly above the destructive reset — the reversible one and the destructive one are only distinguishable side by side |
| The medical disclaimer | Settings, where the same sentence already runs on onboarding, the FAQ, the footer and the docs page |
| A Pro row 18px below the notes row | The same row below a dashed rule, so the plan's own rows stop reading as one monetisation stack |

The trade to be aware of: an icon-only `Skip` is less discoverable than a labelled button, and it is a deliberate bet that
one primary action per row reads better than two. The landing FAQ still says "confirm and skip on every moment", which
stays true — the control moved, the feature did not.

Those six frames do not all come from the same build, and the split is deliberate rather than incidental:

```bash
node scripts/capture-app-screenshots.mjs --set devpost --skip-pro   # 01, 02, 03, 06 from production
node scripts/capture-app-screenshots.mjs --set devpost --only 04-paywall
node scripts/capture-app-screenshots.mjs --set devpost --base-url http://localhost:8081 --only 05-circle-pro
```

Five of the six are captured from `app.collos.sithunyein.com`, which is the only place the Settings screen can show a real store row: a locally built web bundle carries no `EXPO_PUBLIC_REVENUECAT_*` values, so it renders `Status: Preview mode`, `Entitlement: collos_pro` and `RevenueCat project: Not set in this build` — no evidence at all for the RevenueCat criterion. From production the same rows read `Connected`, `collos_pro` and `projaa1359ce`. The paywall is the second production frame, for the same reason: it loads the live offering and says *Billed by RevenueCat Billing* instead of the preview notice.

The Pro-state frame is the exception. Unlocking Pro against production means completing a real card checkout, so `05-circle-pro.png` is captured from a preview-mode build where the unlock is simulated. The rules explicitly allow sandboxed purchases for the Next Gen Award, and the app labels that state on screen rather than hiding it.

The store sizes are **not** interchangeable with that one, so they have their own presets:

```bash
npm run screenshots:appstore   # 1320x2868 -> store/screenshots/appstore/
npm run screenshots:playstore  # 1080x1920 -> store/screenshots/playstore/
```

App Store Connect rejects a set that skips the largest supported display, which is why 1179×2556 is not accepted there, and Google Play refuses any screenshot whose longest side exceeds twice its shortest, which rules out both 1179×2556 and 1320×2868. See `store/listing.md` §5.

`SHIPATON.md` is the working pack for the Shipaton 2026 entry: the eligibility notes, what is still missing, the two-minute demo video script, and the submission copy.

The site also carries the `privacy` and `terms` pages that both app stores require; they are linked from the footer of every page. `landing/vercel.json` sets `cleanUrls`, so they resolve without the `.html` suffix.

### Deploy to Vercel

1. Import this repository into Vercel (or run `vercel` from the repository root).
2. Set the **Root Directory** to `landing`.
3. Leave the **Framework Preset** as `Other`, with no build command and `.` as the output directory.
4. Add the custom domain `collos.sithunyein.com` in **Project Settings → Domains**.
5. Create the DNS record Vercel shows for that domain. Vercel will verify it and issue HTTPS automatically.

The domain is not claimed to be live until Vercel reports the deployment as ready and the custom domain resolves.

## Releasing to the App Store and Google Play

`RELEASE.md` is the full runbook: creating the RevenueCat project, setting the environment variables in all three places they are needed, building, submitting, and the mistakes this project has already made once. `store/listing.md` holds the paste-ready listing copy and the privacy, data-safety, age-rating and content-rating answers.

The pieces that live in the repository:

| File | What it does |
| --- | --- |
| `eas.json` | A `preview` profile for internal distribution (Android APK, iOS simulator build) and a `production` profile for store builds that auto-increments the build numbers |
| `app.json` | `ios.buildNumber`, `android.versionCode`, `scheme`, and the export-compliance answer, so the App Store encryption question is answered without a manual step |
| `store/listing.md` | Store metadata, the pre-flight gates, and the questionnaires |
| `RELEASE.md` | The runbook, including the two traps in §10 |

```bash
npm run release:preview     # internal build you can hand to someone
npm run release:ios         # App Store build
npm run release:android     # Google Play build
npm run submit:ios          # upload to App Store Connect
npm run submit:android      # upload to Google Play
```

EAS builds do **not** read the local `.env`. The `EXPO_PUBLIC_REVENUECAT_*` values have to be set as EAS environment variables per environment, or the build silently ships in preview mode.
