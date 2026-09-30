# Shipaton 2026 submission pack

Everything the submission needs, what is already done, and the short list of things
only you can do. Verified against the official sources on **28 September 2026**
(second pass: the Next Gen category page and RevenueCat's official walkthrough video,
listed in §9).

> **Deadline: 30 September 2026, 11:45 pm PDT** — both registration *and* submission
> close then. After the Submission Period ends you may **not** change the submission
> (Official Rules §5), so submit early and edit until the deadline, never after.
> Judging runs 1–13 October; winners announced 21 October 2026.

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
into two days. But the Next Gen Award **removes that gate entirely**, and its real
requirements are shorter than the main competition's. The official category page is
explicit: "*Unlike most Shipaton categories, this one does not require a paid Apple or
Google developer account, and no App Store or Google Play release is required.*"

| Path | Needs | Reachable in 2 days? |
| --- | --- | --- |
| **Main competition** (Grand Prize, Design, Peace, HAMM, BuildInPublic, …) | A live, publicly downloadable store listing + RevenueCat SDK powering a real purchase | **No.** Store review is the blocker, not code. |
| **Next Gen Award** (students 13+, $20k 1st) | A demo video showing the app working, a **public open-source repo**, an open-source licence file, and a clear description. **No store listing, no paid developer account, no real purchase required.** | **Yes** — student status was verified and confirmed by the organisers on 29 Sep 2026. |

Two things from the official walkthrough video change how this repo should be judged:

**Preview mode is not a compromise — it is the shape the category expects.** The person
who runs judging logistics: *"you need to have some form of monetization even though
it'll be sandboxed and not real purchases."* Collos's paywall — live plans, per-month
math, entitlement gating, a clearly-labelled preview unlock — satisfies that as-is.
Creating the RevenueCat project still matters: it upgrades the demo from preview mode
to a genuine sandbox purchase and supplies the project ID the Devpost form asks for.
But it is an upgrade, not a gate.

**The video must match the app.** *"You can't just come up with a concept for a great
app and then not actually build it — what you show in the video has to match what is
in the app."* That is the rule this repo has been enforcing on itself all along (the
50% mockup, the reminders copy). Nothing in the script in §6 shows anything the binary
does not do.

The full 1st-place prize stack: $20,000, an invitation to RevenueCat's App Growth
Annual conference (New York, October — per the Official Rules this is **admission
only; travel and accommodation are not included**, unlike the Grand Prize and
#BuildInPublic 1st place), a Times Square billboard feature, the Times Square Demo
Day on 22 October 2026, a Shippy trophy, a blog feature, and a media spotlight on
9to5Mac and 9to5Google. 2nd place $10,000; 3rd $5,000.

Student verification runs through the email checker on
<https://www.shipaton.com/next-gen>. Most academic addresses validate automatically;
if yours does not, the page has a contact for a manual check so you are still flagged
for judging. Minors — and teams containing a minor — may compete only for Next Gen,
and need a parent or guardian's name, email and confirmation of consent.

**Student verification: confirmed 29 Sep 2026** by the organisers (RevenueCat,
Perttu Lähteenlahti) after review of the uploaded supporting documents:

> Your confirmed email address is `sithunyein@my.uopeople.edu`.
> Please enter `sithunyein@my.uopeople.edu` in the **student email field of your
> Devpost submission** for the Next Gen Award.

So the eligibility gate is cleared and the address is known. The remaining action is
typing it into the submission's student-email field at submit time — it is a
submission field, not necessarily the Devpost account's own login email.

### "But is it a web app?" — no, and the video is where that gets settled

This is the single most dangerous misreading of the entry, because the rules say plainly
that **"web apps are not eligible."** The facts are unambiguous:

- The dependency that defines the product is **`react-native` 0.74.5** on **Expo SDK 51**.
  The web build only exists because `react-native-web` renders the same components to the
  DOM as an additional target.
- **Native targets are configured, not aspirational:** `ios.bundleIdentifier` =
  `android.package` = `com.collos.app`, `ios.supportsTablet`, `ios.config.usesNonExemptEncryption`
  (iOS export compliance), and an Android `adaptiveIcon` with its own background colour.
  A web app has no use for any of these.
- **The scripts are device scripts:** `expo start --ios`, `expo start --android`, and
  `eas.json` defines native build profiles (iOS simulator, Android APK, AAB).
- **Platform-split native code ships:** `src/storage/fileStore.ts` writes through
  `expo-file-system` (17.0.1) on native while `fileStore.web.ts` uses `localStorage`.
  That split exists *because* it is a native app.

So the risk is not eligibility — it is **presentation**. A video shot entirely in a
browser invites exactly the wrong conclusion, and a judge will not go digging through
`app.json` to correct it. Hence the rule for §6: the **phone is the primary evidence**
(Expo Go, `npm start`, scan the QR code), and the browser appears only as one labelled
cutaway for the live sandbox purchase — the beat the browser genuinely does better,
because that is where the real RevenueCat Billing key is configured.

> **Verified 30 Sep 2026.** The sandbox purchase beat was driven end-to-end on the
> production web build: paywall → "Continue with Pro · $39.99" → RevenueCat's
> Test Store dialog ("Product: yearly_3999") → "Test valid purchase" →
> "Unlimited shared notes are unlocked" → **survived a full page reload** →
> Settings shows "Collos Pro is active · Current period ends Sep 30, 2026".
> The earlier "Pro reads FREE in production" risk is resolved: a fresh purchase
> works today, and the video can film it. One caveat for filming: the sandbox
> entitlement expires the same day it was bought, so run the purchase on the day
> you film. Do not rely on "Restore purchases" for this — on web it is
> deliberately unavailable ("Restore isn't available on the web"), so the
> next-day path is simply buying again; it takes under a minute and the
> FREE → paywall → active arc is the stronger story on camera anyway.

## 2. Eligibility gates

Gates marked **[main]** apply to the main competition only — the Next Gen Award does
not require them. Verified against the category page and the walkthrough video.

| # | Gate | Collos today |
| --- | --- | --- |
| 1 | iOS / iPadOS / macOS / Android app — web apps are **not** eligible | ✅ Native Expo / React Native app with real iOS and Android targets (`ios.bundleIdentifier` and `android.package` are both `com.collos.app`). The web export is an extra target of the *same* codebase, not the product — see "But is it a web app?" below. Show it running on a phone or simulator in the video |
| 2 | RevenueCat SDK powers ≥1 purchase | ✅ `react-native-purchases` 10.10.2, real offerings / purchase / restore / entitlement. For Next Gen, the labelled preview mode is explicitly acceptable ("sandboxed and not real purchases") |
| 3 | New app; first public release inside 1 Aug – 30 Sep 2026 | ✅ Nothing released anywhere; all commits dated 27–28 Sep, inside the window |
| 4 **[main]** | Fully published on a supported store | ➖ Not required for Next Gen. The build path exists anyway — see `RELEASE.md` |
| 5 **[main]** | Available to download in the US | ➖ Follows from #4 |
| 6 | RevenueCat project ID (Devpost form field) | ✅ `projaa1359ce` — live in Settings → Support details and inlined in the production web bundle; sandbox purchase verified 30 Sep |
| 7 | Public YouTube/Vimeo demo video, essential footage <2 min | ❌ Not recorded (script in §6) — the main open item |
| 8 | 1024×1024 app icon | ✅ `assets/icon.png` committed |
| 9 | ≥1 screenshot at **1179×2556**, no device frame | ✅ `submission/screenshots/`, plus store-sized sets in `store/screenshots/` |
| 10 **[main]** | Free trial or promo code for judges | ➖ Not required for Next Gen — judges tap through the sandbox paywall |

For **Next Gen**, student verification is now **confirmed**; the only open items are
§6 (record it) and the Devpost form itself — paste the confirmed address into the
student-email field when you fill it in. For the **main competition**, gates 4–6 and 10
remain open and store review remains unreachable before the deadline.

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
- **The entitlement gates real UI.** Pro is not decorative: shared notes are capped at
  one a day per person on the free plan, and unlocking Pro lifts that cap and visibly
  changes the Circle screen.
- **Three real screens instead of two.** "Circle" and "Settings" were toast stubs
  ("Settings are coming in a future build"). Both are real now. Settings carries
  Restore purchases, Manage subscription, and a store-connection panel showing the
  app user ID, entitlement identifier and project ID — the details a judge needs to
  verify the integration.
- **No key, no crash.** With no `EXPO_PUBLIC_REVENUECAT_*` key the app runs in
  *preview* mode: the flow is fully walkable and clearly labelled as not taking
  payment. The public web demo can never break because a key is missing.
- **Screenshots at the exact size Devpost asks for.** `npm run screenshots:devpost`
  captures 1179×2556 with no device frame. The same script also produces the sizes
  App Store Connect and Google Play actually accept, which are *not* 1179×2556 — see
  `store/listing.md` §5.
- **A release path, not just a run instruction.** `eas.json` defines an internal
  `preview` profile and a store-bound `production` profile, `app.json` carries the
  build numbers and the export-compliance answer, and `RELEASE.md` is the runbook
  from empty RevenueCat project to submitted listing.
- **The store copy stopped promising things the app does not do.** "Gentle
  reminders" was advertised in the paywall and on three screens with no notification
  code behind it. That is an App Store 2.3.1 rejection, and it is removed.

## 4. Checklist: what only you can do

Ordered by what unblocks the most.

1. ~~Create the RevenueCat project~~ **Done 29 Sep:** project `Collos` exists.
2. ~~Add products and one entitlement~~ **Done 29 Sep:** entitlement `collos_pro`,
   products `monthly_499` ($4.99) and `yearly_3999` ($39.99).
3. ~~Create an offering~~ **Done 29 Sep:** both packages are in the *default*
   offering, and the entitlement is attached to them.
4. ~~Create a Web Billing app and copy its key~~ **Done 29 Sep:** the Web Billing
   public key, project ID and entitlement are set in Vercel production. iOS/Android
   would use their own keys from their own apps.
5. ~~Copy the project ID into `EXPO_PUBLIC_REVENUECAT_PROJECT_ID`~~ **Done 29 Sep** —
   it is what Settings displays on screen.
6. ~~Decide the path~~ **Done:** Next Gen.
7. ~~Student verification~~ **Done 29 Sep** — confirmed by the organisers; the address
   `sithunyein@my.uopeople.edu` goes in the Devpost submission's student email field.
8. **Record the demo video** (§6) and upload it to YouTube **public**. The Official
   Rules say the video must be "publicly visible" on YouTube or Vimeo; RevenueCat's
   submission walkthrough says unlisted is fine and private is not, so unlisted is
   the fallback — but public costs nothing and removes the argument.
9. **Fill in the Devpost form** using §7 — including the confirmed student email in
   the student email field.
10. Add a **7-day free trial** or a promo code to the default offering so judges can
   reach premium features.

Steps 1–5 were the environment work (four `EXPO_PUBLIC_*` variables in Vercel:
*Project → Settings → Environment Variables*, followed by a redeploy) and they are
done — see the entry above. What is left is the part only you can do: **step 8
(record the video), step 9 (fill the form), and optionally step 10**.

**Status, 29 Sep.** Verified live: the paywall at app.collos.sithunyein.com loads
the real offering ($4.99 / $39.99 / $3.33 per month) with no preview notice. On a
phone in Expo Go purchases stay in labelled preview mode — iOS/Android store
products are what native keys would buy, and Next Gen explicitly does not require
them. `npm run typecheck` is clean on the current tree.

## 5. The Next Gen path, step by step

Verified against the **Official Rules** (Devpost, updated 31 August 2026) — §4
Submission Requirements and the Next Gen judging criteria — not against marketing
summaries. Where the marketing page and the rules differ, the rules govern (their
§11 says so explicitly).

### The four official judging criteria, mapped to Collos

| Official criterion | Collos's evidence |
| --- | --- |
| "Is the app idea clear, useful, interesting, or original? Does it solve a real problem?" | Care coordination for the family organiser; the description (§7) names the person and the problem in one paragraph. |
| "Does the project demonstrate meaningful progress toward a working app? Is the core functionality clear from the video and code repository?" | Two mock screens became three working tabs with a real purchase path and device-local persistence, all inside the window — the commit history is the progress log, and judges can build and run it from the README. |
| "Does the project thoughtfully use RevenueCat?" | `react-native-purchases` wired per platform with offerings, purchase, restore, entitlement gating real UI, and a labelled preview mode when no key is present. Project created 29 Sep (§4 status): the web build takes a live sandbox purchase through RevenueCat Billing. |
| "Thoughtful technical choices, product thinking, and care in how the app was built and presented?" | The pinned-dependency discipline that fixed a production blank page, the never-failing wrapper pattern, screenshots that assert the UI reacted, and docs that state what is *not* built. |

### Submission requirements (rules §4), and where each stands

| Requirement | Collos |
| --- | --- |
| Text description explaining features and functionality | ✅ §7, paste-ready |
| Qualifying academic email (Next Gen gate) | ✅ **Confirmed 29 Sep 2026** by the organisers: "Your student verification is confirmed for Shipaton 2026." Confirmed address: `sithunyein@my.uopeople.edu`. **At submit time:** paste it into the Devpost submission's **student email field** |
| Demo video, <2 min, **publicly visible on YouTube or Vimeo**, showing the app functioning **on the device for which it was built** | ❌ Not recorded — the device clause matters: film it on a real phone via **Expo Go** or the iOS Simulator, not only the browser. Script in §6. Upload **public** (rules say "publicly visible"; RevenueCat's walkthrough accepts unlisted — treat public as the safe default). |
| Public repo URL, open-source-licensed, **licence detectable and visible in the About section** | ✅ MIT `LICENSE` at the root — GitHub shows it in About automatically; confirm it says "MIT license" on the repo page before submitting |
| 1024×1024 app icon | ✅ `assets/icon.png` (verified 1024×1024) |
| ≥1 screenshot at 1179×2556, no device frame | ✅ `submission/screenshots/` |
| Free trial / promo code | ➖ Explicitly waived for Next Gen: "Next Gen Award Projects will be evaluated using the demonstration video and code repository" |
| Store listing | ➖ Explicitly waived for Next Gen |
| All materials in English | ✅ |

Two rules-side facts that are easy to miss:

- **The student email goes in the submission, and it is already confirmed.** The
  rules say "use a qualifying student or academic email address on Devpost. Email-domain
  eligibility may be verified using JetBrains/swot" — the checker on
  shipaton.com/next-gen is only a pre-check. Verification is now done: submitted
  documents were reviewed and accepted, and the organisers named the exact field to use
  (the Devpost submission's student email field) with the exact address
  `sithunyein@my.uopeople.edu`. Nothing to chase here — just don't mistype it.
- **Minors:** an entrant under the age of majority may enter Next Gen only, and the
  parent/guardian consent form (<https://forms.gle/Gx2Cr4X8WPk9V1q77>) must be
  completed **before the Submission Period ends** — the rules removed the
  "upon request" flexibility for new entries on 31 August 2026.
- **The evaluation surfaces are exactly two: the video and the repo.** The waived-
  requirements clause says Next Gen projects "will be evaluated using the
  demonstration video and code repository." A live web preview is a worthwhile extra
  (§7's "Try it" paragraph), but it is not a review step — nothing in the rules
  obliges a judge to click it, so never let the video lean on it, and keep making
  sure whatever it shows matches the app.

### Order of operations

1. ~~Student verification~~ **Done 29 Sep 2026** — documents reviewed and accepted,
   confirmed address `sithunyein@my.uopeople.edu`. At submit time, enter that address in
   the **student email field of the Devpost submission**. If the form also asks for the
   account email, make sure the account still resolves to an address you can receive mail
   at (notifications about judging go there).
2. **If under the age of majority: complete the guardian consent form now** (link
   above) — it is a deadline, not a formality.
3. **Create the RevenueCat project** (§4, steps 1–5). The rules' Project Requirements
   say the app "uses the RevenueCat SDK to power at least one in-app or web purchase";
   the Next Gen walkthrough confirms sandboxed purchases are acceptable. Preview mode
   satisfies "SDK integrated"; a Test Store purchase satisfies "SDK powers a purchase"
   beyond doubt — and the Ship Kit milestones (perks) track exactly this. Have the
   project ID ready for the Devpost form.
4. **Record the video on a real device** — Expo Go on a phone, or the iOS Simulator.
   Show only what the app does; no copyrighted music, no third-party trademarks or
   logos (rules §4 makes this a submission requirement, not a style tip).
5. **Fill in the Devpost form** using §7, list Next Gen, submit, then keep editing
   until the deadline if needed — but never after it.

## 6. Demo video script (two minutes)

Judges are not required to watch beyond two minutes, and screeners score from the
video plus the description. **Film on the device the app is built for** — a real phone
running the app in Expo Go (`npm start`, scan the QR code), or the iOS Simulator. The
browser build (app.collos.sithunyein.com) is one labelled cutaway for the live sandbox
purchase, not the main evidence: the rules ask for "footage that shows the Project
functioning on the device for which it was built," and they separately disqualify web
apps outright (see "But is it a web app?" in §2). Shooting the whole thing in a browser
is the fastest way to lose an argument you would otherwise win on the config alone.
Never film the Freebuff preview panel — it injects its own badge into the page; use a
plain browser window. No copyrighted music, no third-party trademarks or logos
anywhere in the frame — this is a submission requirement in the Official Rules, and
violating it risks the whole entry.

#### What the screeners and the judges are each required to do

RevenueCat publishes the funnel, and it is what should decide the shape of the video.

**Stage 1 — intake filtering (1 October).** A submission is dropped here unless every
required field is answered and it has: a video, a valid **bundle ID or package name**,
the app icon and screenshots for the Times Square marketing, and — for every other
category — a store link. *"Sadly, but unsurprisingly, a lot of project submissions get
filtered out at this point."* This is also where an entry is tagged for the categories
it may be judged for, taken from the category questions, so an unanswered question means
no judging for that prize.

**Stage 2 — prescreening.** Every entry goes to **at least two** RevenueCat screeners,
who score it 1–5 across the categories it entered. They must watch **the first two
minutes** of the video and read the submission. What they are told to look for in that
window is: the elevator pitch, **the app in use**, and **how and why the app targets the
categories it entered** — which is why the closing caption now names the Next Gen Award.

**Stage 3 — judge scoring.** Each judge must read the **entire** description, watch at
least two minutes of the video, and **review all of the screenshots**, then score 1–5 per
category. Close to 100 apps reach this round across all categories.

**Stage 4 — final selection (8–9 October).** The source material is read once more, and
*"at least one RevenueCat developer advocate downloads the app to confirm it matches what
the video shows."* Under Next Gen there is no store listing, so the live web build and
the public repository are all there is to check against — both must stay reachable until
judging closes on 13 October, and the video may show only what a reviewer can reproduce.

| Time | On screen | Say |
| --- | --- | --- |
| 0:00–0:15 | Onboarding screen | "This is Collos. When you help look after someone, the little things are the first to slip — did she drink water, did anyone actually check in, who is visiting on Sunday. Collos is one calm place for a care circle to keep track." |
| 0:15–0:35 | Tap *Set up my care circle*, type a name, pick a relationship, *Start my plan* | "You set up who you're caring for — one screen. The plan starts empty, because it's yours; nothing here is somebody else's day." |
| 0:35–1:00 | On the empty plan, tap *Start from a template*, then *Confirm* on the morning check-in | "When you'd rather edit than stare at a blank page, the four everyday moments are one tap away — a check-in, a water break, a walk, an evening note. They arrive open, and every confirmation is saved the moment you tap it: close the app, come back, and the plan still remembers." |
| 1:00–1:20 | Circle tab (free) → *Add someone*, then Today → *Shared notes* and write one | "The Circle tab shows who is in the plan and who has checked in today, and it's where a second person joins — each one keeps their own plan and you switch in a tap. Shared notes are the one thing the free plan caps — one a day for each person — and they are kept on this device, still there after a restart." |
| 1:20–1:45 | Tap *Unlock with Pro* → paywall → purchase | "Collos Pro lifts the shared-notes limit — one a day per person on the free plan, as many as your circle needs on Pro. The paywall loads live plans from RevenueCat — real prices, a per-month breakdown, and the entitlement is checked on every launch and after every purchase." *(The key is set: in the browser this is a live sandbox purchase through RevenueCat Billing — film the purchase beat there. On the phone in Expo Go the paywall is labelled preview mode and takes no payment, which the Next Gen walkthrough confirms is acceptable.)* |
| 1:45–2:00 | Circle screen now unlocked, then Settings → *This device* | "The entitlement isn't decorative: the same screen unlocks instantly. Settings exposes the RevenueCat app user ID, entitlement and project ID so this can be verified, and Restore purchases works for anyone reinstalling. This card is read from the phone itself — native iOS, React Native 0.74.5, `com.collos.app`. The browser build is the same codebase exported to web, which is where that purchase just went through." |

#### Three beats the app gained after this script was written

The 0:35–1:00 block is where they fit, and the first is still the better film. All
three are covered by commits in the repository, so the video and the code agree.

- **Skipping moves a moment instead of losing it.** On a moment, tap *Skip*, then the
  **Move to tomorrow** that appears on the row. The moment leaves today and the plan
  header says where it went: *"1 moment moved to tomorrow."* Say the plain version:
  *"Not now is not never — skipping moves it, so nothing you meant to do falls off the
  plan."* It is four seconds and it is
  the one interaction here a judge has not seen in three other care apps.
- **The loop closes on camera.** After the move, jump the device clock forward a
  day and reopen the app: the morning is back on the plan wearing a **"Moved here"**
  chip. Skip → moved → arrived, both halves visible, no mock involved — the chip is
  driven by the same deferred map the store persists. This is the beat that turns a
  nice mechanic into a finished idea; do not cut it for time.
- **A moment can repeat on its own days.** Open a moment with the **⋯**, pick
  *Weekdays*, and save. Its row grows a **Mon–Fri** chip. Say: *"The bins go out on
  Tuesdays and the nurse comes on weekdays — a plan that can't say that isn't
  someone's week."*

The **⋯** also opens rename and delete. Do not spend video time on delete: it is a
safety control, not a story.

Do not use copyrighted music or any third party's trademarks.

### The one-minute cut

A minute is enough, and it is safer than two: the rule is a ceiling (*"should be
less than two minutes"*), and a dense minute reads as confidence. The cost is real
though — this cut drops the Circle-tab and notes beats, which are the only footage
the *"meaningful progress toward a working app"* criterion has for the second
person on a plan. **1:30 is the better film if your pacing holds**; use 1:00 only
if you would otherwise rush the centerpiece.

Every block below exists to score one of the four Next Gen criteria. The project
they are mapped to is noted so nothing is cut by accident.

| Time | Scores | On screen | Say |
| --- | --- | --- | --- |
| 0:00–0:06 | **idea** | Phone in hand, today's plan | "When you help look after someone, the small things are what slip — did she drink water, did anyone actually check in." |
| 0:06–0:16 | **progress** | Cold launch → *Set up my care circle* → name + relationship → *Start my plan* | "One screen sets up who you're caring for. No account, no password. The plan starts empty, because it's yours." |
| 0:16–0:22 | **progress** | *Start from a template* → **0 of 4** | "Four everyday moments, one tap away — and they arrive open, so you only tick what actually happened." |
| 0:22–0:30 | **progress** | *Confirm* the water break → progress ring moves | "Every tap is saved the moment you make it. Close the app, come back — the plan still remembers." |
| 0:30–0:44 | **idea** *(tie-breaker)* | *Skip* → **Move to tomorrow** → header: *"1 moment moved to tomorrow."* → **cut** → clock rolled forward, reopen → the moment is back wearing **Moved here** | "And skipping isn't losing. Move it to tomorrow in one tap, and the plan says where it went. Tomorrow it comes back, marked with where it came from. Not now is not never." |
| 0:44–0:54 | **RevenueCat** | Cut to browser, labelled on screen *web export — same app*: paywall → Test Store → *Collos Pro is active* | "Pro lifts the one limit the free plan has. These are live RevenueCat packages — real prices — and this is a purchase completing through RevenueCat Billing." |
| 0:54–1:00 | **craft** + **category** | Settings → *This device* (native iOS, React Native 0.74.5, `com.collos.app`), then the repo: MIT in About, CI green | "Submitted for the Next Gen Award — a student-built app, judged on this video and the public repository. Same codebase on iOS, Android and web; the repo, the tests and the licence are all public." |

Three production notes, because this cut has no slack in it:

- **It is two takes, not one.** Rolling the phone's clock forward is ~20 seconds of
  Settings you must not film. Shoot the skip in take one, change the clock, shoot the
  arrival in take two, and join them with a caption like *next day*. The state is
  genuinely the app's own; nothing is mocked.
- **The browser may appear once, and never first.** Label it on screen. Everything
  before and after is the phone, because the rules ask for footage "on the device for
  which it was built" — and because a judge who sees a browser window first has
  already decided what your app is.
- **The purchase beat has to be the browser, and has to be today.** On a phone in Expo
  Go `react-native-purchases` has no native module, so the paywall runs in labelled
  preview mode and charges nothing; the browser build is where the live `rcb_` key
  completes a real sandbox purchase. The sandbox entitlement expires the same day it
  is bought, so if you film tomorrow that beat shows **FREE** and is not filmable.

#### Captions instead of a voice-over

**Text-led is the right choice for a one-minute cut**, and not only because a clear
caption beats a mumbled line into a phone mic. Reading runs at roughly 240 words a
minute against speech at about 150, so captions carry materially more meaning per
second — which is precisely the currency when the budget is sixty seconds. They also
survive muted playback, 2x scrubbing and a viewer whose first language is not
English, none of which are hypothetical when a judge is working through a stack of
demos in one sitting. A voice-over is not forbidden and is welcome as a quiet second
reading of the same lines; what it must never be is the *only* carrier of meaning.

The rules constrain the audio bed rather than the narration:

> *"must not include third party trademarks, or copyrighted music or other material
> unless the Entrant has permission to use such material"*

So a commercial track is out unless you hold a licence for it. This is not a
technicality worth risking: a YouTube Content ID claim can mute, restrict or block
the upload, and the video has to be **publicly visible** on YouTube or Vimeo for the
submission to count at all. Three safe options, in order:

1. **No music at all.** Captions over the app's own taps and interface. Zero risk.
2. **A royalty-free bed you can point to a licence for** — the YouTube Audio Library
   is the obvious source, and it is instrumental, which is what you want: lyrics
   compete with reading.
3. **Something you made yourself.** Also zero risk, and it is yours.

Keep any music well under the captions, and **do not put third-party logos in
frame** — that includes the tooling. Crop or avoid Expo Go's chrome, and if you show
GitHub, show the file rather than the header.

Here is the caption text, block by block. Each line is short enough to read in the
time it is on screen — aim for **four to seven words**, and hold each for at least
about a second and a half. Cut between lines on the tap that causes them.

| Time | Captions, in order |
| --- | --- |
| 0:00–0:06 | *Care work is invisible.* → *Did she drink water?* → *Did anyone actually check in?* |
| 0:06–0:16 | *One screen to set up.* → *No account. No password.* |
| 0:16–0:22 | *Four everyday moments, one tap away.* → *They arrive open — tick only what happened.* |
| 0:22–0:30 | *Every tap saves instantly.* |
| 0:30–0:44 | *Skipping isn't losing.* → *Move it to tomorrow.* → *"1 moment moved to tomorrow."* → *NEXT DAY* → *It comes back marked with where it came from.* |
| 0:44–0:54 | *Pro lifts the one limit.* → *Live RevenueCat prices.* → *A real purchase, through RevenueCat Billing.* |
| 0:54–1:00 | *Submitted for the Next Gen Award.* → *iOS, Android and web — one codebase.* → *Repository, tests and licence are public.* |

The captions should name the same facts the voice-over version says. If you later
add narration, keep the captions — they are also the accessible version, and several
judges will watch with sound off.

### Proving it's a native app, on camera

The rules ask for footage of the project "functioning on the device for which it was built" and
disqualify web apps outright, so the video has to make the platform unambiguous. Nothing in the
configuration needs to change to earn that — it already reads as native. These are the shots that
make a judge see it, roughly in order of how much they persuade:

1. **Open on the phone itself.** A hand holding the iPhone, then cut to a screen recording. A
   browser window can be captured on any machine; a phone in a hand cannot.
2. **Record on the device, not the browser** — iOS Control Centre → *Screen Recording*, or
   Android's built-in recorder. The recording keeps what a web export cannot produce: the status
   bar with its clock, Wi-Fi and battery, the notch or Dynamic Island, and the home indicator.
3. **Show a native-only dialog.** Settings → *Reset all data* opens a **real system alert** on
   iOS/Android; the web build deliberately falls back to a two-tap inline confirm because React
   Native 0.74's `Alert` does not exist on web. Tap it, show the OS dialog, tap *Cancel*. That is a
   visible platform divergence in four seconds, and it is already implemented.
4. **Show the phone's own keyboard and the safe-area layout.** Use *add a moment* and type with the
   native keyboard; the layout clears the notch and the home indicator.
5. **Land on Settings → *This device*.** The card reads platform, OS version, device, the React
   Native runtime (`0.74.5`), `com.collos.app` and app version out of the running app, and on a
   phone it says *Native iOS app*. Then say the sentence that settles it: *"this is the iOS app;
   the browser version is the same React Native codebase exported to web."*
6. **Only then cut to the browser**, label it on screen (*web export — same app*), and use it for
   the purchase beat alone.
7. **Say it in writing too** — §7 already carries the sentence, and judges score from the video
   *and* the repo. Both surfaces should tell the same story.

Two traps: never let the browser be the first thing on screen, and don't leave Expo Go's dev menus
in the take. Expo Go is honest and expected for Next Gen (no store release is required), but the
video should show *the app*, not the tooling that launched it.

#### What may and may not appear on screen

Nothing forbids a terminal, an editor or the repository — it is your own material,
and the rules only require that the app also appear, functioning, on its own device.
But at sixty seconds the file is the thing that matters, and developer tooling spends
it badly:

- **It spends the one budget the criteria actually score.** Criterion two is *"the
  core functionality clear from the video and code repository"* — the video's job is
  the app behaving, and every second in a terminal is a second not doing that.
- **A laptop is off-message.** This is a mobile category. Footage of a shell prompt
  works against the platform impression the rest of the video is building.
- **It reads as a project, not a product.** Criterion four asks for *"product thinking
  and care"*. A scroll of build output signals coursework; a calm screen that survives
  being closed and reopened signals a product.
- **It is evidence the judge already has.** The repository is judged by *reading* it,
  not by watching you drive it. Time spent on terminal output duplicates what the
  reviewer will open anyway.

The inverse is the useful rule. What makes footage hard to fake is **consequence**:
state that outlives the app, a dialog that comes from the operating system, an
entitlement that survives a reload, a device held in a hand. Those prove a working app
far more cheaply than any log does.

If you can afford the seconds — which means the 1:30 cut, not the 60-second one —
one terminal shot earns its place: `npm test` printing **29 passing**. It is the
single frame that speaks to *"thoughtful technical choices"*, and it is real. Cap it
at three seconds, with a caption, and keep the repo page itself out of the take so no
third-party logo crosses the frame.

## 7. Devpost description (paste-ready)

**Tagline** — Share the small moments that help someone you love feel supported.

**What it is.** Collos is a care-coordination app for families looking after an ageing
parent or a relative who needs a hand. Care work is invisible and easily dropped: one
sibling does the morning call, another does the shopping, and nobody knows what has
actually been done. Collos turns that into a short, shared daily plan.

**Try it.** The video shows the app running on a phone. You can also open the same
codebase in a browser — <https://app.collos.sithunyein.com> is a live, interactive
preview of the mobile UI (web is an Expo export of this React Native app, not a
separate build). Without a store key configured it runs in a clearly-labelled
preview mode and takes no payment; project site: <https://collos.sithunyein.com>.

**Who it's for.** The person in a family who has quietly become the organiser — usually
the one who lives closest, or the only one who remembers.

**What it does.** Care recipients each get a daily plan of small check-ins. You confirm
or skip a moment and the plan remembers it — on device, immediately, across restarts.
Recipients are switched with one tap when you are caring for more than one person, and
you can add your own moments to any plan. Every moment can be revised: rename it, or
move it to another day. Skipping is not a dead end — a skipped moment offers to move
itself to tomorrow, so "not now, later" is something you can actually record. Each
moment also carries its own repeat rule (every day, weekdays, weekends), so a plan can
be one person's real week instead of a fixed four. The Circle screen shows who is
involved and who has checked in today.

**How it makes money.** A free tier covering the full daily plan and one shared note a
day per person, and Collos Pro — unlimited shared notes — as a monthly or annual
subscription through RevenueCat. The entitlement is enforced in the
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

**What was built during the hackathon window.** The app went from two mock screens to
a working product: device-local persistence (every confirmation survives a restart,
with a settings reset), a full moment editor — add, revise, reschedule, delete — per
moment repeat rules, a real RevenueCat purchase path with sandboxable preview mode,
and three full screens. **What's next.** A backend so a care circle can actually be
shared between phones, scheduled reminders, and store releases for iOS and Android.

**Categories targeted.** *(Tick only what you can evidence.)* Next Gen Award — student
project, public repository, MIT licensed. RevenueCat Design Award — the interaction
detail is in the shared plan, the progress ring, and the paywall's plan comparison.
RevenueCat Peace Prize — the people who benefit are family carers, and specifically the
one person who ends up carrying the mental load alone.

### The form fields, ready to paste

| Devpost field | Value |
| --- | --- |
| Project name | Collos |
| Tagline | Share the small moments that help someone you love feel supported. |
| Repo URL | <https://github.com/thesithunyein/collos> — public, MIT (`LICENSE` shows in About) |
| Demo video | Public YouTube/Vimeo link, once recorded (§6) |
| Built with | React Native, Expo, TypeScript, RevenueCat |
| **Student email** | `sithunyein@my.uopeople.edu` — **confirmed by the organisers 29 Sep**, and the address they explicitly told you to enter in this field |
| RevenueCat project ID | `projaa1359ce` — the value set as `EXPO_PUBLIC_REVENUECAT_PROJECT_ID` in Vercel; the app's **Settings → Store connection** screen displays the same value, so a reviewer can compare the two |
| **Bundle ID / package name** | `com.collos.app` — **check this before submitting.** Stage 1 intake filtering verifies "a valid bundle ID or package name, which we can use to check that the app has the RevenueCat SDK integrated correctly". Fill the field if the form offers one; if it does not, put `com.collos.app` in the additional-details box. This is a filter, not a preference |
| Screenshot | Any file from `submission/screenshots/` (1179×2556, no device frame) |
| Icon | `assets/icon.png` (1024×1024) |
| Category | **Next Gen Award** — plus Design Award and Peace Prize only if you can evidence them (§8) |

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
- **Next Gen** — the only category whose requirements this repo can fully satisfy
today, and now the recommended one: the category page confirms no store listing is
required, and the walkthrough confirms sandboxed monetization is acceptable.

## 9. Sources

- <https://revenuecat-shipaton-2026.devpost.com/rules> — **Official Rules** (authoritative; §4 submission requirements, Next Gen criteria in §6, §5 no-changes-after-deadline)
- <https://revenuecat-shipaton-2026.devpost.com/> — official rules and prizes
- <https://www.revenuecat.com/blog/engineering/how-to-submit-your-app-for-shipaton> — the submission walkthrough, eligibility gates, required assets
- <https://www.shipaton.com/blog/how-we-judge-shipaton> — intake filtering, prescreening, 1–5 scoring, final selection
- <https://www.shipaton.com/categories/next-gen-award> — Next Gen requirements: no paid developer account, no store release, video + public repo + licence + description
- <https://www.shipaton.com/next-gen> — student email checker and manual-verification contact
- <https://www.youtube.com/watch?v=ygcLzFj5HGk> — official Next Gen walkthrough (Charlie & Partou, RevenueCat): sandboxed monetization acceptable, video must match the app, judges compare pre-hackathon repo state
- <https://www.revenuecat.com/docs/getting-started/installation/expo> — Expo install and web configuration
- <https://www.revenuecat.com/blog/engineering/revenuecat-react-native-sdk-adds-react-native-web-support> — RN Web support from SDK 9.7.6
