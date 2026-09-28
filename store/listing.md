# Store listing pack

Paste-ready App Store Connect and Google Play copy, plus the answers to the forms that
reject a submission when they are wrong. Everything here is written to match what the
code actually does **today** — read §1 before submitting, because two of those gates
are still open.

---

## 1. Do not submit until these are true

A listing is a legal declaration about the shipped binary. These are the items that
make the difference between a live listing and a rejected one.

| # | Must be true at submission time | Why |
| --- | --- | --- |
| 1 | A release build exists from `eas.json`'s `production` profile | Both stores upload a binary, not a repository |
| 2 | `EXPO_PUBLIC_REVENUECAT_*` keys are set for the platform being submitted, and the dashboard has a **default** offering with a monthly and an annual package | Without them the app ships in *preview* mode and takes no payment, so the listing would describe a subscription that does not exist |
| 3 | A **free trial or promo code** is attached to that offering | Apple and Google both expect a way to evaluate the subscription; §4 also uses it for the review notes |
| 4 | `store/screenshots/{appstore,playstore}/` are re-captured from that exact build | Screenshots showing a different build is a rejection reason |
| 5 | `https://collos.sithunyein.com/privacy` resolves | Both stores require a reachable privacy policy URL |
| 6 | The Data safety and Privacy Nutrition answers in §6 still match `package.json` | Adding any analytics or crash SDK changes them |

Gates 1–3 need a store developer account and a RevenueCat project; they cannot be
produced by a code change.

## 2. Identity

| Field | Value |
| --- | --- |
| App name | `Collos: Care, together` |
| iOS bundle identifier | `com.collos.app` |
| Android application ID | `com.collos.app` |
| Marketing version | `1.0.0` (`expo.version` in `app.json`) |
| iOS build number | `1` (`expo.ios.buildNumber`) |
| Android version code | `1` (`expo.android.versionCode`) |
| Primary category | Lifestyle |
| Secondary category (iOS) | Productivity |
| Play category | Lifestyle |
| Price | Free with in-app subscriptions |
| Marketing URL | `https://collos.sithunyein.com` |
| Support URL | `https://collos.sithunyein.com` |
| Privacy policy URL | `https://collos.sithunyein.com/privacy` |
| Support email | `sithunyein.mailto@gmail.com` |
| Copyright | `2026 Sithu Nyein` |

`expo.scheme` is `collos`, and `expo.ios.config.usesNonExemptEncryption` is `false`.
The app links only against the platform's own TLS, so the App Store export-compliance
question is answered automatically and no annual self-classification report is needed.

## 3. App Store Connect

**Name** (30 max)

```
Collos: Care, together
```

**Subtitle** (30 max)

```
Share the everyday load
```

**Promotional text** (170 max — editable without a new build, so keep it current)

```
Collos keeps a family's daily care plan in one shared place, so nobody has to ask what's been done. Set up a circle, confirm small moments, and hand off with context.
```

**Keywords** (100 max, comma-separated, no spaces after commas. Deliberately avoids
words already in the name or subtitle.)

```
caregiver,eldercare,family care,care circle,check in,care plan,shared tasks,care log
```

**Description**

```
When you help look after someone, the small things are the first to slip. Did she drink water. Did anyone actually check in. Who is visiting on Sunday.

Collos is one calm place for a care circle to keep track.

SET UP YOUR CIRCLE
Add who you are caring for and the people who help. Switch between recipients with one tap when you look after more than one person.

A SHORT PLAN FOR TODAY
Each recipient has a few small care moments, not a wall of tasks. Add your own moments, confirm what happened, skip what did not, and leave the rest for later.

IT REMEMBERS
Every confirmation is saved the moment you tap it. Close the app, come back tomorrow, and the plan still remembers - no account needed, nothing leaves your device.

A SHARED NOTE
Leave a short note for the next person: how the morning went, what to watch for, what was already handled.

GENTLE, NOT DEMANDING
Collos is built for people who are already doing a lot, and it is designed to take one small thing off your plate. No streaks, no scores, no pressure.

COLLOS PRO
Collos Pro adds unlimited invites and shared notes to your care circle, as a monthly or annual subscription. Payment is charged to your store account and renews until you cancel; manage or cancel it in your account settings.

PRIVATE BY DESIGN
Your care circle is yours. Collos does not sell data, does not show ads, and does not require a social account. There is no medical record and no diagnosis anywhere in the app.

A NOTE ON SAFETY
Collos is for care coordination only. It is not medical advice and does not replace a qualified care professional. In an emergency, contact your local emergency number.

Terms of use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy policy: https://collos.sithunyein.com/privacy
```

**What's new in this version**

```
First release.
```

**App Review notes** — reviewers reject an app they cannot get into, so be explicit:

```
Collos is a care-coordination app. No account or login is required to review it.

To reach the subscription:
1. Launch the app and tap "Set up my care circle".
2. Tap "Circle" in the bottom navigation.
3. Tap "Unlock with Pro" to open the paywall. It loads live packages from the
   default RevenueCat offering, so the StoreKit price sheet is real.
4. A 7-day free trial is attached to the monthly package. No promo code is needed.

The "Settings" tab shows the RevenueCat app user ID, the entitlement identifier
("pro") and the project ID, and provides "Restore purchases" and
"Manage subscription".

The entitlement is not cosmetic: with Pro active, the Circle screen unlocks
multiple invites and unlimited shared notes. Compare step 2 with the same screen
after purchasing.

Collos makes no medical claims and contains no medical records.
```

## 4. Google Play

**App name** (30 max)

```
Collos: Care, together
```

**Short description** (80 max)

```
Keep a family's daily care plan in one shared place.
```

**Full description**

Use the App Store description from §3 verbatim, with two changes: replace the
"Terms of use (EULA)" line with
`Terms: https://collos.sithunyein.com/terms`, and keep the safety note. Play
rejects listings that reference another platform's store terms.

**Store settings**

| Field | Value |
| --- | --- |
| App category | Lifestyle |
| Tags | Caregiving, Family, Task management |
| Contact email | `sithunyein.mailto@gmail.com` |
| Website | `https://collos.sithunyein.com` |
| Ads | **No**, contains no ads |
| In-app purchases | **Yes**, $2.99–$39.99 per item |
| Government app | No |
| Financial features | No |
| Health apps declaration | No health features; answer *No* to every health-data question |

Google needs a **Data safety** form; Apple needs **App Privacy → Data Types**. Both
are answered in §6.

## 5. Assets

Regenerate the screenshots with the npm scripts. Each set is captured at CSS pixel
sizes whose device scale factor lands on the store's required pixel size exactly, so
nothing is ever resampled.

| Store | Command | Output | Pixel size | Why that size |
| --- | --- | --- | --- | --- |
| App Store Connect | `npm run screenshots:appstore` | `store/screenshots/appstore/` | 1320×2868 | The 6.9-inch iPhone size. App Store Connect rejects a set that skips the largest supported display, so a 6.1-inch set alone is not accepted. |
| Google Play | `npm run screenshots:playstore` | `store/screenshots/playstore/` | 1080×1920 | Play rejects any screenshot whose longest side exceeds twice its shortest. Both 1179×2556 and 1320×2868 break that rule; 9:16 does not. |
| Shipaton / Devpost | `npm run screenshots:devpost` | `submission/screenshots/` | 1179×2556 | The size the Shipaton brief asks for. |
| Landing page | `npm run screenshots` | `landing/` | 780×1688 | Twice the CSS size of the two phone frames on the site. |

Each set captures the same six screens in the same order — onboarding, today, the
locked circle, the paywall, the unlocked circle, and Settings — so a reviewer can see
the entitlement actually change the UI.

Apple also requires a **1024×1024** icon with no alpha and no rounded corners:
`assets/icon.png`, committed. Play takes the same file, and reads the adaptive icon
from `assets/adaptive-icon.png` with a `#000000` background — the same canvas the
logo is drawn on.

There is no App Preview video on either store. Both are optional; if one is added it
must be captured from the shipped build, not from the web export.

## 6. Privacy and data safety answers

`package.json` currently ships **no analytics, no crash reporting, no advertising, and
no attribution SDK**. The only third party that receives anything is RevenueCat, and
only once a key is configured. These answers are correct for that dependency list and
become wrong the moment that changes.

**Apple — App Privacy → Data Types**

| Category | Declared? | Detail |
| --- | --- | --- |
| Purchases → Purchase History | **Yes** | Used for app functionality. Linked to the app user ID. Not used for tracking. |
| Identifiers → User ID | **Yes** | RevenueCat's app user ID, used to attach the entitlement to the install. |
| Contact Info | No | No account, no email collection. |
| Health & Fitness | No | Collos stores no health data and makes no medical claims. |
| Location, Contacts, Photos, Search History, Browsing History | No | Not requested, not collected. |
| Usage Data, Diagnostics | No | No analytics or crash SDK is installed. |
| Advertising Data | No | No ads. |
| **Tracking (ATT)** | **No** | "Data used to track you" is empty, so no App Tracking Transparency prompt is required. |

**Google Play — Data safety**

| Question | Answer |
| --- | --- |
| Does your app collect or share required user data types? | Yes |
| Data type: **Financial info → Purchase history** | Collected. Not shared. Processed ephemerally: no. Required: yes. Purpose: App functionality. |
| Data type: **Device or other IDs** | Collected. Not shared. Purpose: App functionality. (RevenueCat provisions an anonymous app user ID for a device that has never signed in.) |
| All other data types | Not collected. Care-plan entries are stored on-device only and never transmitted to Collos or any third party. |
| Is all user data encrypted in transit? | Yes |
| Do you provide a way for users to request data deletion? | Yes — the RevenueCat app user ID is anonymous and uninstall-scoped; deletion requests go to the support email. State this in the privacy policy. |
| Has your app been independently validated against a global security standard? | No |

**Apple — Age Rating**

| Question | Answer |
| --- | --- |
| Medical or Treatment Information | Infrequent/Mild — the app coordinates everyday care for a person and mentions care recipients, but gives no diagnosis or treatment |
| Violence, Sexuality, Profanity, Horror, Gambling, Alcohol/Tobacco/Drugs, Mature Themes | None |
| Unrestricted Web Access, User-Generated Content shown publicly | No |
| Resulting rating | **4+** (some regions raise this to 12+ on the medical answer alone) |

**Google Play — Content rating (IARC questionnaire)**

Answer *No* to every content question, and *No* to "does the app share user location".
The result is **Everyone / PEGI 3**. Select *Utility* as the app type when asked, so the
questionnaire does not ask for the game-rating track.

## 7. Still open, and honest about it

These are in the listing copy above as things the app does **today**. Anything that
cannot be demonstrated in the submitted binary does not belong in a store listing, so
do not add the following until they exist:

- **Sharing between phones.** The care plan is device-local: every confirmation is
  saved and survives a restart, but on one device only. Two phones do not see the same
  plan yet, so the description says "the plan still remembers" (true per device) and
  never "shared", "in real time", or "everyone sees the same plan". The §1 gate about
  matching the shipped binary applies to this line exactly as to any other.
- **Reminders.** This one was already wrong and is now fixed in code, not just here.
  The paywall was selling "gentle reminders" and the Circle, Today and Settings
  screens all repeated it, but no notification code existed anywhere. Every mention
  was removed from the app, the landing page and this pack. A feature listed in a
  store description that the binary does not deliver is an App Store **2.3.1**
  rejection, and on this project it was the same drift that once left a "50%"
  dashboard on the landing page. Re-add the copy in the same change that ships
  delivery, and extend the Data safety answers in §6 with the notification token.
- **Terms of use.** Apple only requires the standard EULA link above. Play the copy
  in §4 points at `/terms`; both `privacy` and `terms` now exist and are linked from the
  site footer, so nothing is left to create before submitting.
