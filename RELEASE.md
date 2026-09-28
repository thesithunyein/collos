# Release runbook

From an empty RevenueCat project to a submitted store listing. Written against the
state of this repository as of 28 September 2026, and deliberately explicit about
which steps only a human with account access can perform.

**Current state, honestly:** `eas.json` and the store metadata are in the repository,
`app.json` carries the build numbers and the export-compliance answer, the app has a
real RevenueCat integration, and three screenshot sets are captured at the sizes the
stores actually accept. What does not exist yet is a RevenueCat project, an EAS
project, and any store listing. Steps 1–2 and 5–9 are account work, not code.

> Timeboxing note: a first App Store review is typically days, and a first Google Play
> review for a new developer account can take longer because new accounts are enrolled
> in a slower review track. Start step 5 as early as you can; nothing later in this
> document can compress a store's review queue.

---

## 0. Accounts you need

| Store | Account | Cost | Needed for |
| --- | --- | --- | --- |
| Apple | Apple Developer Program | $99/year | Any iOS build that runs on a real device, and any App Store submission |
| Google | Google Play Console | $25 once | Any Play submission |
| Expo | Expo account | Free | EAS Build |
| RevenueCat | Account | Free | Entitlements, offerings, and the project ID the Shipaton form asks for |

An Expo **free** plan can build, but EAS free builds queue behind paid ones. The
`preview` profile in `eas.json` is built specifically so that a free Apple account is
not a total blocker: it targets the iOS **simulator**, which needs no provisioning
profile and no paid membership. Android internal distribution is unaffected.

## 1. Create the RevenueCat project

In <https://app.revenuecat.com>, with no project yet, the first screen offers *Create a
project*. Then, inside it:

1. **Entitlement** — create one with identifier `pro`, exactly. The app reads
   `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` and defaults to `pro`; if the identifier
   differs, Pro can never activate no matter how well the purchase flow works.
2. **Products** — one per store, per billing period. A monthly and an annual on each
   store you intend to ship.
3. **Offering** — create one and mark it the **default**. This is the one the app
   loads; a non-default offering is invisible to it.
4. **Packages** — attach the monthly product as *Monthly* and the annual as *Annual*.
   The paywall preselects the package RevenueCat marks as highlighted, computes the
   per-month equivalent, and shows a *save X%* badge when an annual package costs less
   than twelve months of the monthly one. All of that only appears if both packages
   exist.
5. **Apps** — one per platform, each producing its own public SDK key:

| Platform | App type | Key prefix | Environment variable |
| --- | --- | --- | --- |
| iOS | App Store | `appl_` | `EXPO_PUBLIC_REVENUECAT_IOS_KEY` |
| Android | Play Store | `goog_` | `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` |
| Web | Web Billing | `rcb_` | `EXPO_PUBLIC_REVENUECAT_WEB_KEY` |

Never use a secret key (`sk_`) here. Everything under `EXPO_PUBLIC_*` is embedded in
the JavaScript bundle and is readable by anyone.

**A free trial or a promo code belongs on the default offering.** Both stores expect a
way for a reviewer to evaluate a subscription, and it is also how you demo the feature
without paying yourself.

### Verifying the integration before any store product exists

RevenueCat's **Test Store** lets a development build complete a purchase with fake test
cards, with no App Store Connect product and no sandbox account. Configure the app with
the Test Store key and the whole flow — offerings, purchase, entitlement, restore —
runs end to end. Two limits worth knowing: the Test Store key only works in a
development build, never in a release build, and it does not cover the browser build.

## 2. Set the environment variables in three places

The values are identical; only where they live differs, and missing one of these is the
most likely reason a build behaves differently from `npm start`.

**Locally** — copy `.env.example` to `.env` and fill it in. `.env` is gitignored.

**For EAS builds** — EAS does **not** read your local `.env`. Set the same values as EAS
environment variables, per environment, so that `preview` and `production` can differ:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY \
  --value appl_xxxxxxxx --environment production --visibility plaintext
```

Repeat for `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_REVENUECAT_WEB_KEY`,
`EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` and `EXPO_PUBLIC_REVENUECAT_PROJECT_ID`, and again
for `--environment preview`. On an older EAS CLI without `env:create`, `eas secret:create
--name … --value … --scope project` is the equivalent.

These are public values, so `--visibility plaintext` is correct; a `secret` visibility
still works, but it hides the value from you later for no benefit.

**On Vercel** — *Project → Settings → Environment Variables*, then redeploy. `EXPO_PUBLIC_*`
values are inlined by Metro at build time, so changing one requires a **rebuild**, not
just a restart. A redeploy alone is enough only because the deploy runs the build.

## 3. Verify locally before spending a build

```bash
npm install
npm run typecheck          # tsc --noEmit
npm run build:web          # writes dist/
```

Then start the app and walk the flow: onboarding → today → Circle → *Unlock with Pro* →
purchase → Circle now shows *Invites are unlocked*. Confirm the Settings tab shows the
app user ID, the entitlement identifier `pro`, and the project ID.

If the paywall says *Preview… RevenueCat isn't connected*, the key for the platform you
are running on is missing — which is by design, not a bug. The app degrades to a
clearly-labelled preview rather than throwing, so a missing key can look like a working
build.

## 4. Link the EAS project

```bash
npx eas-cli login
npm run release:init        # npx eas-cli init — writes extra.eas.projectId into app.json
git add app.json && git commit -m "Link the EAS project"
```

`eas init` must add `expo.extra.eas.projectId` to `app.json`. If it reports a slug
conflict, another Expo account already owns the slug `collos`; change `expo.slug` and
`expo.owner` rather than guessing, because the slug determines the project's identity.

## 5. Build

```bash
npm run release:preview                    # internal: Android APK, iOS simulator build
npm run release:ios                        # production: App Store build
npm run release:android                    # production: Play AAB
```

`release:preview` is the fastest way to get something a person can actually hold. The
Android APK installs directly from the link EAS prints. The iOS output is a simulator
build, so it opens in Xcode's simulator rather than on a phone.

For an iOS build that runs on a real device you need the paid Apple membership plus
`eas device:create` to register the device's UDID, then a build without the simulator
flag:

```bash
npx eas-cli build --profile preview --platform ios --device
```

## 6. Submit

```bash
npm run submit:ios
npm run submit:android
```

Both need one-time credentials:

- **iOS** — an App Store Connect app record must exist first (create it in App Store
  Connect, bundle ID `com.collos.app`). `eas submit` will offer to create and store an
  App Store Connect API key.
- **Android** — create the app in Play Console first, complete the store-listing
  prerequisites, and give EAS a Google Service Account JSON key with release
  permissions. The **first** AAB for a brand-new app usually has to be uploaded through
  the Play Console UI; after that `eas submit` handles it. Do not upload a build signed
  with a different keystore, or Play will refuse every later upload — let EAS manage the
  keystore.

## 7. Store listing

`store/listing.md` holds paste-ready copy for both stores, the answers to the privacy,
data-safety, age-rating and content-rating questionnaires, and the asset requirement
table. Read its §1 first: it is the list of things that must be true before submitting,
and §7 is the list of claims deliberately kept out of the copy because the app does not
do them yet.

## 8. Assets

```bash
npm run screenshots:appstore     # 1320x2868 -> store/screenshots/appstore/
npm run screenshots:playstore    # 1080x1920 -> store/screenshots/playstore/
npm run screenshots:devpost      # 1179x2556 -> submission/screenshots/
npm run screenshots              # 780x1688  -> landing/
```

Each set captures the same six screens and asserts the app actually moved between them,
so a run fails loudly instead of writing a wrong screenshot. Two things matter:

- **Re-capture from the build you are submitting**, not from the web export. A store
  screenshot showing a different build is a rejection reason in its own right.
- The sizes are not interchangeable. App Store Connect rejects a set that skips the
  largest supported display, and Google Play refuses any screenshot whose longest side
  exceeds twice its shortest — which rules out both 1179×2556 and 1320×2868.

Then, if the UI changed, refresh the landing page too:

```bash
cd landing && VERCEL_TELEMETRY_DISABLED=1 vercel --prod --yes
```

## 9. Versioning

`eas.json` sets `"appVersionSource": "local"`, so the numbers live in `app.json` where
they can be reviewed in a diff:

```json
"version": "1.0.0",
"ios": { "buildNumber": "1" },
"android": { "versionCode": 1 }
```

The `production` profile sets `autoIncrement: true`, so EAS bumps `ios.buildNumber` and
`android.versionCode` for you and writes the result back into `app.json`. **Commit that
change after every production build**, or the next build will reuse a number and the
store will reject the upload as a duplicate. `expo.version` is the user-visible version
and is never incremented automatically — bump it yourself for a release that users
should see as new.

## 10. Two traps this repository has already hit

**Never let an Expo package float.** The web build once shipped a blank white page in
production: `@expo/vector-icons` drifted to a version whose wildcard `expo-font: "*"`
peer resolution pulled a modern `expo-font` into this SDK 51 tree, where
`expo-modules-core` has no `registerWebModule`, so the app died before its first render.
The bundle built successfully and failed only at runtime. `expo-font` is pinned exactly
and additionally guarded by an `overrides` entry in `package.json` for that reason, and
`react-native-purchases` is pinned exactly because it carries the same shape of wildcard
peer (`react-native-web: "*"`).

After any dependency change, prove the tree did not move:

```bash
npm ls expo-modules-core expo-font react-native-web @expo/vector-icons
npm run build:web && npm run typecheck
```

Then open the built web app and confirm it renders, rather than trusting the build exit
code. A blank page is the failure mode here, and it is silent.

**Do not advertise what the binary does not do.** The paywall used to list "gentle
reminders" on the strength of a plan rather than any notification code; the same pattern
had earlier left a "50%" CSS mockup on the landing page months after the app showed 25%.
Both are now fixed. Anything added to the paywall, the landing page, or a store
description should be demonstrable in the shipped build, because a feature listed but
absent is an App Store **2.3.1** rejection.

## 11. Definition of done

- [ ] `npm run typecheck` and `npm run build:web` both pass, and the web build renders
- [ ] RevenueCat has an entitlement `pro`, a **default** offering, and monthly + annual packages
- [ ] A free trial or promo code is attached, so reviewers can reach Pro
- [ ] All five `EXPO_PUBLIC_REVENUECAT_*` values are set locally, in EAS, and on Vercel
- [ ] A purchase, a cancellation, and a restore each behave correctly on a real build
- [ ] The Circle screen visibly unlocks when Pro activates
- [ ] Screenshots re-captured from the submitted build at each store's required size
- [ ] `https://collos.sithunyein.com/privacy` and `/terms` resolve
- [ ] `store/listing.md` §1 and §7 re-read against what the build actually does
- [ ] `ios.buildNumber` / `android.versionCode` committed after the last production build
- [ ] Privacy, data-safety, age-rating and content-rating forms completed from `store/listing.md` §6

## 12. Troubleshooting

| Symptom | Cause |
| --- | --- |
| Paywall shows *Preview* in a build that has keys locally | EAS does not read `.env`. Set the variables with `eas env:create` and rebuild. |
| Paywall shows *Preview* on the live web app | `EXPO_PUBLIC_REVENUECAT_WEB_KEY` is unset in Vercel, or the variable was added without a rebuild. |
| Plans never load but the store key is set | No **default** offering, or packages missing from it. |
| Purchase succeeds, Pro stays off | The entitlement identifier does not match. It must be exactly `pro` unless `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` says otherwise. |
| Store rejects the upload as a duplicate version | `autoIncrement` bumped `app.json` and the change was not committed. |
| Blank white page on web | A floated Expo dependency. See §10. |
