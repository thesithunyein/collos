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
| **Next Gen Award** (students 13+, $20k 1st) | A demo video showing the app working, a **public open-source repo**, an open-source licence file, and a clear description. **No store listing, no paid developer account, no real purchase required.** | **Yes** — if your academic email passes the checker. |

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

## 2. Eligibility gates

Gates marked **[main]** apply to the main competition only — the Next Gen Award does
not require them. Verified against the category page and the walkthrough video.

| # | Gate | Collos today |
| --- | --- | --- |
| 1 | iOS / iPadOS / macOS / Android app — web apps are **not** eligible | ⚠️ Native Expo app. Judges must be able to build and run it — show it running on a device or simulator in the video (the web export also runs) |
| 2 | RevenueCat SDK powers ≥1 purchase | ✅ `react-native-purchases` 10.10.2, real offerings / purchase / restore / entitlement. For Next Gen, the labelled preview mode is explicitly acceptable ("sandboxed and not real purchases") |
| 3 | New app; first public release inside 1 Aug – 30 Sep 2026 | ✅ Nothing released anywhere; all commits dated 27–28 Sep, inside the window |
| 4 **[main]** | Fully published on a supported store | ➖ Not required for Next Gen. The build path exists anyway — see `RELEASE.md` |
| 5 **[main]** | Available to download in the US | ➖ Follows from #4 |
| 6 | RevenueCat project ID (Devpost form field) | ⚠️ Free, ~10 min in the dashboard; also upgrades the demo to a real sandbox purchase |
| 7 | Public YouTube/Vimeo demo video, essential footage <2 min | ❌ Not recorded (script in §6) — the main open item |
| 8 | 1024×1024 app icon | ✅ `assets/icon.png` committed |
| 9 | ≥1 screenshot at **1179×2556**, no device frame | ✅ `submission/screenshots/`, plus store-sized sets in `store/screenshots/` |
| 10 **[main]** | Free trial or promo code for judges | ➖ Not required for Next Gen — judges tap through the sandbox paywall |

For **Next Gen**, the only open items are §6 (record it), the student-email check, and
the Devpost form. For the **main competition**, gates 4–6 and 10 remain open and store
review remains unreachable before the deadline.

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
7. **Record the demo video** (§6) and upload it to YouTube **public**. The Official
   Rules say the video must be "publicly visible" on YouTube or Vimeo; RevenueCat's
   submission walkthrough says unlisted is fine and private is not, so unlisted is
   the fallback — but public costs nothing and removes the argument.
8. **Fill in the Devpost form** using §7.
9. Add a **7-day free trial** or a promo code to the default offering so judges can
   reach premium features.

Setting the four environment variables is a one-line change in Vercel
(*Project → Settings → Environment Variables*), followed by a redeploy.

**Status, 29 Sep: done.** Project `Collos` exists (Test Store / RevenueCat
Billing app), entitlement `collos_pro` attached to `monthly_499` ($4.99) and
`yearly_3999` ($39.99) in the default offering, and the web key, project ID
and entitlement are set in Vercel production. Verified live: the paywall at
app.collos.sithunyein.com loads the real offering ($4.99 / $39.99 / $3.33 per
month) with no preview notice. On a phone in Expo Go purchases stay in
labelled preview mode — iOS/Android store products are what native keys would
buy, and Next Gen explicitly does not require them.

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
| Qualifying academic email (Next Gen gate) | ✅ Pre-checked 28 Sep: `my.uopeople.edu` is recognised on shipaton.com/next-gen. **Still required:** that same email must be on the Devpost account itself — check Devpost → Settings before submitting |
| Demo video, <2 min, **publicly visible on YouTube or Vimeo**, showing the app functioning **on the device for which it was built** | ❌ Not recorded — the device clause matters: film it on a real phone via **Expo Go** or the iOS Simulator, not only the browser. Script in §6. Upload **public** (rules say "publicly visible"; RevenueCat's walkthrough accepts unlisted — treat public as the safe default). |
| Public repo URL, open-source-licensed, **licence detectable and visible in the About section** | ✅ MIT `LICENSE` at the root — GitHub shows it in About automatically; confirm it says "MIT license" on the repo page before submitting |
| 1024×1024 app icon | ✅ `assets/icon.png` (verified 1024×1024) |
| ≥1 screenshot at 1179×2556, no device frame | ✅ `submission/screenshots/` |
| Free trial / promo code | ➖ Explicitly waived for Next Gen: "Next Gen Award Projects will be evaluated using the demonstration video and code repository" |
| Store listing | ➖ Explicitly waived for Next Gen |
| All materials in English | ✅ |

Two rules-side facts that are easy to miss:

- **The qualifying academic email must be on the Devpost account itself** — "use a
  qualifying student or academic email address on Devpost. Email-domain eligibility
  may be verified using JetBrains/swot." The checker on shipaton.com/next-gen is a
  pre-check, not the verification. Update the Devpost account email first if needed.
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

1. **Put the academic email on the Devpost account and check it** at
   <https://www.shipaton.com/next-gen>. The one gate no code can clear. If the checker
   rejects a real academic domain, use the contact there for a manual check today —
   the rules point to JetBrains/swot for domain verification, and unlisted domains are
   resolved manually.
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
browser build (app.collos.sithunyein.com) is a fine closing shot but not the main
evidence: the rules ask for "footage that shows the Project functioning on the device
for which it was built." No copyrighted music, no third-party trademarks or logos
anywhere in the frame — this is a submission requirement in the Official Rules, and
violating it risks the whole entry.

| Time | On screen | Say |
| --- | --- | --- |
| 0:00–0:15 | Onboarding screen | "This is Collos. When you help look after someone, the little things are the first to slip — did she drink water, did anyone actually check in, who is visiting on Sunday. Collos is one calm place for a care circle to keep track." |
| 0:15–0:40 | Tap *Set up my care circle*, dashboard | "You set up who you're caring for, and each day gets a short care plan. Confirm what happened, skip what didn't." |
| 0:40–1:00 | Tap *Confirm* on Water break, watch 25% become 50% | "Every confirmation is saved the moment you tap it — close the app, come back tomorrow, and the plan still remembers. Nothing you confirmed gets lost." |
| 1:00–1:20 | Circle tab, free state | "The Circle tab shows everyone involved. On the free plan you get one helper and one shared note a day — that's a deliberate limit, not a paywall on a core feature." |
| 1:20–1:45 | Tap *Unlock with Pro* → paywall → purchase | "Collos Pro adds unlimited invites and unlimited shared notes. The paywall loads live plans from RevenueCat — real prices, a per-month breakdown, and the entitlement is checked on every launch and after every purchase." *(The key is set: in the browser this is a live sandbox purchase through RevenueCat Billing — film the purchase beat there. On the phone in Expo Go the paywall is labelled preview mode and takes no payment, which the Next Gen walkthrough confirms is acceptable.)* |
| 1:45–2:00 | Circle screen now unlocked, then Settings | "The entitlement isn't decorative: the same screen unlocks instantly. Settings exposes the RevenueCat app user ID, entitlement and project ID so this can be verified, and Restore purchases works for anyone reinstalling." |

Do not use copyrighted music or any third party's trademarks.

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
you can add your own moments to any plan. The Circle screen shows who is involved and
who has checked in today.

**How it makes money.** A free tier covering one helper and one shared note a day, and
Collos Pro — unlimited invites and unlimited shared notes — as a monthly or annual
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
with a settings reset), an add-a-moment flow, a real RevenueCat purchase path with
sandboxable preview mode, and three full screens. **What's next.** A backend so a care
circle can actually be shared between phones, scheduled reminders, and store releases
for iOS and Android.

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
