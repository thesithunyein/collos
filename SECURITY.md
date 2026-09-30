# Security policy

## The short version

Collos has **no backend, no accounts and no server-side data**. The care plan,
the notes, the confirmations and the settings are written to storage on the
device that created them. There is no database to breach, no user table to leak
and no session to steal, because none of those things exist.

That is a deliberate product decision as much as a technical one — see the
privacy section of the [README](README.md#data-storage-and-privacy) — but it also
defines the honest scope of this policy: the interesting risks in Collos are on
the device, not behind an API.

## Supported versions

| Version | Supported |
| --- | --- |
| `1.x` (current) | Yes — fixes land on the default branch |
| Anything older | No |

## Reporting a vulnerability

Email **sithunyein.mailto@gmail.com** with the subject line `SECURITY — Collos`.
Please include what you did, what happened, and what you expected, plus the
platform you were on (the app prints platform, OS version, device, React Native
runtime and app identifier under **Settings → This device**, which saves a round
trip).

Please do **not** open a public issue for anything that could be exploited, and
please do not test against the live sites with automated scanners — both are
static or client-only, so a scan generates noise without finding anything, and it
costs the project its hosting quota.

You will get an acknowledgement within a few days. This is an independent project
rather than a company, so there is no bug bounty and no 24-hour SLA, and saying so
is more useful than implying otherwise. Fixes are credited in the commit that
lands unless you ask not to be named.

## What is in scope

- The app: `App.tsx`, everything under `src/`, and the native configuration in
  `app.json` / `eas.json`.
- Storage: `src/storage/` — how the plan and the notes are written, read, and
  cleared on each platform.
- The purchase path: `src/purchases/` — key resolution, entitlement checks, the
  preview-mode fallback, and anything that could grant Pro without a purchase.
- The landing site: `landing/` — the pages, `script.js`, `styles.css`, and the
  Vercel configuration for both deployments.
- The tooling: `scripts/capture-app-screenshots.mjs` and the generators under
  `assets/`.

## What is not a vulnerability here

- **The RevenueCat SDK keys in the client.** Every `EXPO_PUBLIC_REVENUECAT_*`
  value is a *public* SDK key, designed to ship inside an app. The app rejects
  secret keys by design, and if a secret key were ever pasted into `.env.example`
  that would be a critical finding — but a public key appearing in the bundle is
  the intended behaviour, not a leak.
- **Reading the local plan.** It is your own data on your own device, and there is
  no account boundary to cross. Anyone with the unlocked device and the
  development tools can read it; that is true of every app that stores data
  locally, and it is why the app says plainly that deleting it is permanent.
- **No rate limiting, no CSRF, no session handling.** There is no server.
- **Missing HTTP security headers on the static site** where Vercel already
  provides sane defaults. If you believe a header is missing that Vercel does not
  set, that is still worth reporting — just describe it as a hardening request.

## Handling of secrets in this repository

- `.env` and every `.env.*` file is ignored by git. `.env.example` is the only
  committed one, and it contains empty values and comments.
- The repository is checked for secret-shaped strings before release; the only
  matches in a built bundle are the RevenueCat SDK's own guard against secret
  keys, and a glyph name in the Material Symbols font table.
- Store credentials, EAS tokens and Vercel tokens live in those services'
  environment settings, never in this repository.
