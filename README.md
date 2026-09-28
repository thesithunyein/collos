# Collos

Collos is a mobile-first care coordination experience built with Expo and React Native. It helps a care circle share small, everyday moments of support without making medical claims.

> **Safety note:** Collos is for care coordination only. It is not medical advice and does not replace a qualified care professional.

## Project brief

We built the first real Collos mobile experience: a calm onboarding flow and caregiver dashboard for coordinating everyday moments of support. The app is designed for a 375px mobile viewport, with accessible touch targets and clear safety copy.

**Functional now:** onboarding, care-circle recipient switching, daily care-plan cards, confirmed/not-confirmed/skipped task states, loading/empty/error UI states, and a Pro paywall shell prepared for RevenueCat Test Store configuration. The public landing page is a separate static surface in `landing/`.

**Still to build:** Supabase-backed shared persistence, real RevenueCat Test Store wiring and entitlements, push/local notifications, and signed production mobile builds.

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

## Dependency versions

The app targets Expo SDK 51, so every Expo package must stay on its SDK 51 version. `expo-font` is pinned to `~12.0.10` and additionally guarded by an `overrides` entry in `package.json`, because `@expo/vector-icons` declares `expo-font` as a wildcard peer dependency: a floating range resolves it to the newest release, and a newer `expo-font` calls `registerWebModule`, which does not exist in SDK 51's `expo-modules-core`. The web bundle then builds successfully and throws at runtime, leaving a blank page. If you upgrade Expo, move `expo`, `expo-font`, and `@expo/vector-icons` together in one change.

## Deploy the Expo web app

The same Expo app exports a browser build without changing the native entry point:

```bash
npm install
npm run build:web
```

The repository-root `vercel.json` builds the web app into `dist/`. In Vercel, import this repository with the **Root Directory** set to `.` and the `Other` framework preset. The intended app domain is `https://app.collos.sithunyein.com`; add it under **Project Settings → Domains** and create the DNS record Vercel provides. If the custom domain is not attached yet, use the exact Vercel deployment URL shown in the project dashboard instead.

Web mode supports the onboarding and dashboard interaction flow with mock data. Native notifications and store purchases are not available in web mode; the Pro surface remains a preview shell until RevenueCat is wired for native builds. Supabase shared persistence is also not implemented yet.

## Project shape

- `App.tsx` contains the first functional vertical slice: onboarding, dashboard, recipient switching, task state changes, loading/error/empty states, and the Pro paywall shell.
- `src/data/mockCare.ts` is the temporary data boundary. Replace this module with Supabase queries and mutations later without coupling the UI to a backend SDK.
- `.env.example` documents the future RevenueCat Test Store keys. No secrets are committed.

The paywall copy and action are intentionally shell-only. RevenueCat initialization, entitlement checks, and purchase restoration should be added after product identifiers and store configuration are available.

## Public landing page

The static marketing site lives in `landing/` so it can deploy independently without changing the Expo app. It uses the existing Collos brand direction and has no runtime dependencies.
The two phone previews are real captures of the running app (`landing/app-onboarding.png` and `landing/app-dashboard.png`), not hand-built CSS mockups. The site therefore cannot advertise a dashboard the app does not render: an earlier mockup kept claiming "50%" and "2 of 4 confirmed" months after the app showed 25% and 1 of 4. Re-capture them after any UI change so the two stay in sync:

```bash
npm run screenshots
```

The script launches a local Chrome or Edge headless, drives the web app over the DevTools protocol, and rewrites both PNGs in `landing/`. It has no npm dependencies and needs no secrets. Point it at a local build with `--base-url http://localhost:8081`, or set `CHROME_PATH` if Chrome is not installed in the usual location.

### Deploy to Vercel

1. Import this repository into Vercel (or run `vercel` from the repository root).
2. Set the **Root Directory** to `landing`.
3. Leave the **Framework Preset** as `Other`, with no build command and `.` as the output directory.
4. Add the custom domain `collos.sithunyein.com` in **Project Settings → Domains**.
5. Create the DNS record Vercel shows for that domain. Vercel will verify it and issue HTTPS automatically.

The domain is not claimed to be live until Vercel reports the deployment as ready and the custom domain resolves.
