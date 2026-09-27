# Collos

Collos is a mobile-first care coordination experience built with Expo and React Native. It helps a care circle share small, everyday moments of support without making medical claims.

> **Safety note:** Collos is for care coordination only. It is not medical advice and does not replace a qualified care professional.

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

## Project shape

- `App.tsx` contains the first functional vertical slice: onboarding, dashboard, recipient switching, task state changes, loading/error/empty states, and the Pro paywall shell.
- `src/data/mockCare.ts` is the temporary data boundary. Replace this module with Supabase queries and mutations later without coupling the UI to a backend SDK.
- `.env.example` documents the future RevenueCat Test Store keys. No secrets are committed.

The paywall copy and action are intentionally shell-only. RevenueCat initialization, entitlement checks, and purchase restoration should be added after product identifiers and store configuration are available.

## Public landing page

The static marketing site lives in `landing/` so it can deploy independently without changing the Expo app. It uses the existing Collos brand direction, includes CSS-rendered app preview placeholders, and has no runtime dependencies.

### Deploy to Vercel

1. Import this repository into Vercel (or run `vercel` from the repository root).
2. Set the **Root Directory** to `landing`.
3. Leave the **Framework Preset** as `Other`, with no build command and `.` as the output directory.
4. Add the custom domain `collos.sithunyein.com` in **Project Settings → Domains**.
5. Create the DNS record Vercel shows for that domain. Vercel will verify it and issue HTTPS automatically.

The domain is not claimed to be live until Vercel reports the deployment as ready and the custom domain resolves.
