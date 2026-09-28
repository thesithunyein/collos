# Collos

Collos is a mobile-first care coordination experience built with Expo and React Native. It helps a care circle share small, everyday moments of support without making medical claims.

> **Safety note:** Collos is for care coordination only. It is not medical advice and does not replace a qualified care professional.

## Project brief

Collos is for the person in a family who has quietly become the organiser. Care work is invisible and easy to drop: one sibling does the morning call, another does the shopping, and nobody is sure what has actually been done. Collos turns that into a short, shared daily plan.

**Functional now:** onboarding, care-circle recipient switching, daily care-plan cards, confirmed/not-confirmed/skipped task states, loading/empty/error UI states, a real RevenueCat purchase flow (offerings, purchase, restore, entitlement gating), and three working tabs — Today, Circle, and Settings.

**Still to build:** Supabase-backed shared persistence, push/local notifications, and signed production builds for the App Store and Google Play.

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
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` | Entitlement identifier that unlocks Pro. Defaults to `pro`. |
| `EXPO_PUBLIC_REVENUECAT_PROJECT_ID` | `prj_…` from the dashboard. Shown in the app's Settings screen. |

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
App.tsx                        app shell: stage, tab routing, nav, paywall
src/theme.ts                   colour palette (mirrors brand.md)
src/purchases/config.ts        platform key resolution, entitlement id, preview detection
src/purchases/revenuecat.ts    SDK wrapper: init, offerings, purchase, restore, error mapping
src/purchases/usePro.ts        the hook the UI consumes
src/components/                NavItem, TaskCard, PaywallModal
src/screens/                   Onboarding, Today, Circle, Settings
src/data/mockCare.ts           the temporary data boundary
```

- `src/data/mockCare.ts` is the temporary data boundary. Replace this module with Supabase queries and mutations later without coupling the UI to a backend SDK.
- `src/purchases/` is the only place that imports the RevenueCat SDK, so the rest of the UI only ever sees plans and a `pro` boolean.
- The Pro entitlement gates real UI: care-circle invites and shared notes are locked until it is active. Settings exposes the app user ID, entitlement identifier, and project ID, which is what a reviewer needs to verify the integration.
- `.env.example` documents every environment variable. No secrets are committed.

## Deploy the Expo web app

The same Expo app exports a browser build without changing the native entry point:

```bash
npm install
npm run build:web
```

The repository-root `vercel.json` builds the web app into `dist/`. In Vercel, import this repository with the **Root Directory** set to `.` and the `Other` framework preset. The intended app domain is `https://app.collos.sithunyein.com`; add it under **Project Settings → Domains** and create the DNS record Vercel provides. If the custom domain is not attached yet, use the exact Vercel deployment URL shown in the project dashboard instead.

Web mode runs the full interaction flow. Web purchases bill through RevenueCat Billing, so a configured `EXPO_PUBLIC_REVENUECAT_WEB_KEY` makes the browser build take real subscriptions. Without that key the build stays in preview mode. Supabase shared persistence is not implemented yet.

## Public landing page

The static marketing site lives in `landing/` so it can deploy independently without changing the Expo app. It uses the existing Collos brand direction and has no runtime dependencies.
The two phone previews are real captures of the running app (`landing/app-onboarding.png` and `landing/app-dashboard.png`), not hand-built CSS mockups. The site therefore cannot advertise a dashboard the app does not render: an earlier mockup kept claiming "50%" and "2 of 4 confirmed" months after the app showed 25% and 1 of 4. Re-capture them after any UI change so the two stay in sync:

```bash
npm run screenshots
```

The script launches a local Chrome or Edge headless, drives the web app over the DevTools protocol, and rewrites both PNGs in `landing/`. It has no npm dependencies and needs no secrets. Point it at a local build with `--base-url http://localhost:8081`, or set `CHROME_PATH` if Chrome is not installed in the usual location.

## Submission assets

```bash
npm run screenshots:devpost
```

That writes six screenshots to `submission/screenshots/` at **1179×2556** — the exact size Devpost asks for, with no device frame. It captures at 393×852 CSS pixels with a 3× device scale factor, so the output needs no resampling. The `--set devpost` flow drives the real app through onboarding, the daily plan, the locked circle, the paywall, the unlocked circle, and Settings.

`SHIPATON.md` holds the Shipaton 2026 submission pack: the eligibility gates, what is still missing, the two-minute demo video script, and paste-ready Devpost copy.

### Deploy to Vercel

1. Import this repository into Vercel (or run `vercel` from the repository root).
2. Set the **Root Directory** to `landing`.
3. Leave the **Framework Preset** as `Other`, with no build command and `.` as the output directory.
4. Add the custom domain `collos.sithunyein.com` in **Project Settings → Domains**.
5. Create the DNS record Vercel shows for that domain. Vercel will verify it and issue HTTPS automatically.

The domain is not claimed to be live until Vercel reports the deployment as ready and the custom domain resolves.
