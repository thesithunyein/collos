# Shipaton 2026 submission pack

Everything the submission needs, what is already done, and the short list of things
only you can do. Verified against the official sources on **28 September 2026**.

> **Deadline: 30 September 2026, 11:45 pm PDT.** Submissions go through Devpost.
> You can keep editing after you submit, but an unsaved draft does not count.

---

## 1. Bottom line

Collos has a real RevenueCat integration as of this commit. That closes the single
biggest technical gap. But it does **not** make the project a 10/10 entry, and no
amount of code in the remaining ~2 days can, because of one hard gate:

> "Be fully published on the Apple App Store, Google Play Store, Mac App Store, or
> Samsung Galaxy Store."
> "TestFlight or testing-track builds don't count."
> "What if my app is still waiting for store review at the deadline? **It will not
> qualify.**"

A store listing needs app review, which takes days to weeks. It cannot be compressed
into two days. So the realistic ceiling depends entirely on one fork:

| Path | Needs | Reachable in 2 days? |
| --- | --- | --- |
| **Main competition** (Grand Prize, Design, Peace, HAMM, BuildInPublic, …) | A live, publicly downloadable store listing + RevenueCat SDK powering a real purchase | **No.** Store review is the blocker, not code. |
| **Next Gen Award** (student, $20k 1st) | A **public open-source repo** with a licence, a demo video, and a description. **No store listing and no paid developer account required.** | **Yes** — if you have a verifiable academic email. |

So: if you are a student with a `.edu` (or equivalent) address, next year's worth of
polish is not required — the Next Gen route is genuinely winnable in two days, and
this repo now satisfies almost all of it. If not, the honest answer is that this entry
cannot qualify this year, and the right move is to ship properly for a future window.

Note that minors (and teams containing a minor) may only enter Next Gen.

## 2. Eligibility gates

| # | Gate | Collos today |
| --- | --- | --- |
| 1 | iOS / iPadOS / macOS / Android app — web apps are **not** eligible | ⚠️ Expo project targets all three, but nothing is built or listed |
| 2 | RevenueCat SDK powers ≥1 in-app or web purchase (or RevenueCat Ads) | ✅ **Done in this commit** — `react-native-purchases` 10.10.2, real offerings / purchase / restore / entitlement |
| 3 | New app; first public release inside 1 Aug – 30 Sep 2026 | ✅ Nothing has ever been released anywhere |
| 4 | Fully published on a supported store | ❌ Nothing in any store, no `eas.json` |
| 5 | Available to download in the US | ❌ Follows from #4 |
| 6 | RevenueCat project ID (required field on the form) | ❌ Dashboard still shows "Create a project" |
| 7 | Public YouTube/Vimeo demo video, essential footage <2 min | ❌ Not recorded (script in §6) |
| 8 | 1024×1024 app icon | ✅ `assets/icon.png` committed |
| 9 | ≥1 screenshot at **1179×2556**, no device frame | ✅ **Done in this commit** — `submission/screenshots/` |
| 10 | Free trial or promo code for judges to test premium features | ❌ Needs a store product to attach it to |

Gates 1 and 4–6, 10 are the ones still open, and every one of them requires a
dashboard or a store, not a code change.

## 3. What this commit changed

- **RevenueCat is actually wired up.** `react-native-purchases` 10.10.2 is a real
  dependency and is present in the production web bundle. `Purchases.configure` runs
  per platform, `getOfferings` / `purchasePackage` / `getCustomerInfo` /
  `restorePurchases` are all implemented behind `src/purchases/`.
- **The paywall now sells something.** The primary button used to be
  `onPress={onClose}` — it only dismissed the sheet. It now renders live store
  packages, shows the real localised price, preselects the highlighted plan,
  computes a per-month equivalent and a "save X%" badge, and handles cancelled,
  failed, and already-subscribed outcomes separately.
- **The entitlement gates real UI.** Pro is not decorative: the care-circle invites
  and shared notes are gated, and unlocking Pro visibly changes the Circle screen.
- **Three real screens instead of two.** "Circle" and "Settings" were toast stubs
  ("Settings are coming in a future build"). Both are real now. Settings carries
  Restore purchases, Manage subscription, and a store-connection panel showing the
  app user ID, entitlement identifier and project ID — the details a judge needs to
  verify the integration.
- **No key, no crash.** With no `EXPO_PUBLIC_REVENUECAT_*` key the app runs in
  *preview* mode: the flow is fully walkable and clearly labelled as not taking
  payment. The public web demo can never break because a key is missing.
- **Screenshots at the exact size Devpost asks for.** `npm run screenshots:devpost`
  captures 1179×2556 with no device frame.

## 4. Checklist: what only you can do

Ordered by what unblocks the most.

1. **Create the RevenueCat project** at <https://app.revenuecat.com> → *Create a
   project* → name it Collos. Your account currently has none.
2. **Add products and one entitlement** named `pro`; attach the products to it.
3. **Create an offering** (make it the *default*) with a monthly and an annual
   package.
4. **Create a Web Billing app** in the project (*Project → Apps → New → Web
   Billing*), then copy its public key into `EXPO_PUBLIC_REVENUECAT_WEB_KEY`. This is
   what makes the live web demo take a real purchase. iOS/Android use their own keys
   from their own apps.
5. **Copy the project ID** (`prj_…`) into `EXPO_PUBLIC_REVENUECAT_PROJECT_ID` so it
   shows up in Settings.
6. **Decide the path**: Next Gen (student, this week) or a proper store launch later.
7. **Record the demo video** (§6) and upload it to YouTube as *unlisted*, not private.
8. **Fill in the Devpost form** using §7.
9. Add a **7-day free trial** or a promo code to the default offering so judges can
   reach premium features.

Setting the four environment variables is a one-line change in Vercel
(*Project → Settings → Environment Variables*), followed by a redeploy.

## 5. If you are taking the Next Gen path

Already satisfied: public repository, MIT `LICENSE`, an open-source-licensed
codebase, a working RevenueCat integration, and real screenshots. Still required:

- A **verifiable academic email** (school, university, bootcamp or similar).
- Setup instructions a stranger can follow — see the README.
- A **demo video** showing the app working (§6).
- A clear description (§7).
- If you are under the age of majority where you live: a parent or guardian's name,
  email, and confirmation of consent.

## 6. Demo video script (two minutes)

Judges are only required to watch the first two minutes, and screeners score from the
video plus the description. Cover the pitch, the app in use, the purchase, and the
categories you are targeting — in that order.

| Time | On screen | Say |
| --- | --- | --- |
| 0:00–0:15 | Onboarding screen | "This is Collos. When you help look after someone, the little things are the first to slip — did she drink water, did anyone actually check in, who is visiting on Sunday. Collos is one calm place for a care circle to keep track." |
| 0:15–0:40 | Tap *Set up my care circle*, dashboard | "You set up who you're caring for, and each day gets a short care plan. Confirm what happened, skip what didn't." |
| 0:40–1:00 | Tap *Confirm* on Water break, watch 25% become 50% | "Every confirmation updates the plan, so if a sibling opens the app, they can see what's already been done today." |
| 1:00–1:20 | Circle tab, free state | "The Circle tab shows everyone involved. On the free plan you get one helper and one shared note a day — that's a deliberate limit, not a paywall on a core feature." |
| 1:20–1:45 | Tap *Unlock with Pro* → paywall → purchase | "Collos Pro adds unlimited invites, unlimited shared notes, and gentle reminders. This is a live RevenueCat purchase — the SDK fetches the offering, the StoreKit sheet is real, and the entitlement is checked on every launch and after every purchase." |
| 1:45–2:00 | Circle screen now unlocked, then Settings | "The entitlement isn't decorative: the same screen unlocks instantly. Settings exposes the RevenueCat app user ID, entitlement and project ID so this can be verified, and Restore purchases works for anyone reinstalling." |

Do not use copyrighted music or any third party's trademarks.

## 7. Devpost description (paste-ready)

**Tagline** — Share the small moments that help someone you love feel supported.

**What it is.** Collos is a care-coordination app for families looking after an ageing
parent or a relative who needs a hand. Care work is invisible and easily dropped: one
sibling does the morning call, another does the shopping, and nobody knows what has
actually been done. Collos turns that into a short, shared daily plan.

**Who it's for.** The person in a family who has quietly become the organiser — usually
the one who lives closest, or the only one who remembers.

**What it does.** Care recipients each get a daily plan of small check-ins. Anyone in
the circle confirms or skips a moment, and the plan's completion is visible to
everyone. Recipients are switched with one tap when you are caring for more than one
person. The Circle screen shows who is involved and who has checked in today.

**How it makes money.** A free tier covering one helper and one shared note a day, and
Collos Pro — unlimited invites, unlimited shared notes, and gentle reminders — as a
monthly or annual subscription through RevenueCat. The entitlement is enforced in the
UI, not just displayed.

**RevenueCat integration.** `react-native-purchases` is initialised per platform, and
the paywall renders live packages from the default offering with their localised
prices. `purchasePackage`, `getCustomerInfo` and `restorePurchases` are all
implemented, entitlement checks run on launch and after every purchase, and cancelled
or failed purchases are handled separately from success. Web purchases route through
RevenueCat Billing so the same entitlement works in the browser and on device. The app
degrades to a clearly-labelled preview mode when no SDK key is present, so the public
demo never breaks.

**What was hard.** The scariest bug was a blank white page in production. The cause was
a floating transitive dependency: `@expo/vector-icons` drifted to a version whose
wildcard `expo-font: "*"` peer pulled a modern `expo-font` into an Expo SDK 51 tree,
where `expo-modules-core` has no `registerWebModule`, so the app died before its first
render. The fix was pinning exact versions and adding an `overrides` entry — and the
lesson was that `*` peer ranges are load-bearing in a pinned SDK tree. Adding
`react-native-purchases` afterwards carried exactly that risk, so the dependency tree
was fingerprinted before and after and verified unchanged.

**What's next.** Real persistence so a care circle can actually be shared between
phones, scheduled reminders, and store releases for iOS and Android.

**Categories targeted.** *(Tick only what you can evidence.)* Next Gen Award — student
project, public repository, MIT licensed. RevenueCat Design Award — the interaction
detail is in the shared plan, the progress ring, and the paywall's plan comparison.
RevenueCat Peace Prize — the people who benefit are family carers, and specifically the
one person who ends up carrying the mental load alone.

## 8. Category notes

Judge each against what the category page actually asks for, and do not tick a box you
cannot evidence — the intake screen tags you for categories based on what you wrote, and
an empty answer means you are not judged for that category at all.

- **Grand Prize** — needs post-launch numbers (downloads, revenue, conversion,
  retention). You will have none. Skip it rather than submit an empty answer.
- **#BuildInPublic** — needs public posts and evidence that feedback changed the app.
  Only enter if you actually posted.
- **Design Award** — the strongest honest fit. Point judges at specific interactions.
- **Peace Prize** — strong fit if described concretely: name who benefits.
- **Next Gen** — the only category whose requirements this repo can fully satisfy today.

## 9. Sources

- <https://revenuecat-shipaton-2026.devpost.com/> — official rules and prizes
- <https://www.revenuecat.com/blog/engineering/how-to-submit-your-app-for-shipaton> — the submission walkthrough, eligibility gates, required assets
- <https://www.shipaton.com/blog/how-we-judge-shipaton> — intake filtering, prescreening, 1–5 scoring, final selection
- <https://www.shipaton.com/categories/next-gen-award> — Next Gen requirements
- <https://www.revenuecat.com/docs/getting-started/installation/expo> — Expo install and web configuration
- <https://www.revenuecat.com/blog/engineering/revenuecat-react-native-sdk-adds-react-native-web-support> — RN Web support from SDK 9.7.6
