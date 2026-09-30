#!/usr/bin/env node
/**
 * Capture real screenshots of the running Collos app.
 *
 * Two jobs:
 *   1. `--set landing` feeds the landing page. That page used to hand-build a CSS
 *      imitation of the dashboard, which silently drifted from the app (it
 *      advertised "50%" and "2 of 4 confirmed" long after the app showed "25%"
 *      and "1 of 4"). These PNGs come from the app itself, so the landing page
 *      cannot contradict it.
 *   2. `--set devpost` produces the Shipaton submission screenshots. Devpost asks
 *      for at least one 1179x2556 screenshot with NO device frame, so that preset
 *      captures at 393x852 CSS pixels with a 3x device scale factor, which is
 *      exactly 1179x2556 device pixels.
 *   3. `--set appstore` produces the same six screens at 1320x2868, the 6.9-inch
 *      iPhone size App Store Connect expects. App Store Connect rejects a set that
 *      skips the largest supported display, so 1179x2556 alone is not enough.
 *   4. `--set playstore` produces them at 1080x1920. Google Play refuses any
 *      screenshot whose longest side is more than twice its shortest, which rules
 *      out both 1179x2556 (1179 x 2 < 2556) and 1320x2868.
 *
 * Usage:
 *   node scripts/capture-app-screenshots.mjs
 *   node scripts/capture-app-screenshots.mjs --set devpost
 *   node scripts/capture-app-screenshots.mjs --set appstore
 *   node scripts/capture-app-screenshots.mjs --set playstore
 *   node scripts/capture-app-screenshots.mjs --base-url http://localhost:8081 --out-dir landing
 *
 * `--only 04-paywall` runs the tour only as far as the screenshots you name and
 * writes just those, which is how the paywall shot is taken against the live app
 * (where the real RevenueCat offering loads) without ever pressing *Continue with
 * Pro* — a purchase there would leave the browser on Stripe, not on the app.
 * Separate several with commas: `--only 03-circle-free,04-paywall`.
 *
 * Requires a local Chrome or Edge. Override with CHROME_PATH if neither is found
 * in the usual places. No npm dependencies: it talks to the browser over the
 * DevTools protocol using Node's built-in WebSocket.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// --- options ---------------------------------------------------------------
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
/** Boolean switches take no value, so `--skip-pro` on its own means true. */
const flag = (name) => argv.includes(`--${name}`);

const SET = arg("set", "landing");
const ONLY = arg("only", "");
if (!["landing", "devpost", "appstore", "playstore"].includes(SET)) {
  console.error(
    `Unknown --set "${SET}". Use "landing", "devpost", "appstore" or "playstore".`,
  );
  process.exit(1);
}

/**
 * 1179x2556 is the pixel size Shipaton asks for. 393 x 852 CSS px at a 3x device
 * scale factor lands on it exactly, so the output needs no resampling.
 */
const PRESETS = {
  landing: { width: 390, height: 844, scale: 2 },
  devpost: { width: 393, height: 852, scale: 3 },
  // 440 x 956 CSS px at 3x is the 6.9-inch iPhone size, 1320 x 2868 exactly.
  appstore: { width: 440, height: 956, scale: 3 },
  // 360 x 640 CSS px at 3x is 1080 x 1920, a 9:16 phone capture. Play rejects
  // anything longer than 2:1, so the taller sets above are not usable there.
  playstore: { width: 360, height: 640, scale: 3 },
};

const VIEWPORT = PRESETS[SET];
const BASE_URL = arg("base-url", "https://app.collos.sithunyein.com/");
const OUT_DIRS = {
  landing: "landing",
  devpost: "submission/screenshots",
  appstore: "store/screenshots/appstore",
  playstore: "store/screenshots/playstore",
};
const PORTS = { landing: 9333, devpost: 9334, appstore: 9335, playstore: 9336 };

const OUT_DIR = path.resolve(arg("out-dir", OUT_DIRS[SET]));
const PORT = Number(arg("port", String(PORTS[SET])));

/**
 * Each step presses something, waits for the app to react, then captures.
 * `expect` is matched against the document text to prove the app actually moved.
 */
/**
 * The setup steps a person performs, as presses and one typed field.
 *
 * Setup used to be a single press: the plan was waiting behind it, fully formed
 * for two people the user had never met. It now asks who they are caring for,
 * so the tour answers — which means every screenshot of a populated plan was
 * earned on camera rather than inherited from the build.
 */
const SETUP_PRESSES = [
  "Set up my care circle",
  { type: { label: "Their name", value: "Margaret" } },
  "Mum",
  // The organiser is whoever runs the tour; the field is optional in the app
  // but the greeting and circle card read from it, so the screenshots name the
  // person holding the phone rather than falling back to a neutral greeting.
  { type: { label: "Your name, optional", value: "Sithu" } },
  "Start my plan",
];

const FLOWS = {
  landing: [
    { file: "app-onboarding.png", label: "onboarding" },
    {
      file: "app-dashboard.png",
      label: "dashboard",
      presses: [...SETUP_PRESSES, "Start from a template", "Confirm"],
      expect: "Today.s moments",
    },
    // The editor is captured next, while the plan is still on screen: pressing
    // the "Today" tab to come back from the circle would be ambiguous, because
    // "Today" is the word on every screen of this app — the moment rows, the
    // section heading, and the member pills.
    {
      file: "app-editor.png",
      label: "moment editor",
      press: "Edit Water break",
      expect: "Move to tomorrow",
    },
    // The circle comes last, because the sheet has to be closed first: it covers
    // the tab bar, so a "Circle" press would land on its scrim.
    //
    // The page gives each of the four screens one home — the dashboard is the
    // hero, the band shows setup and the editor, the showcase shows the circle —
    // so nothing on it repeats a screenshot.
    {
      file: "app-circle.png",
      label: "care circle",
      presses: ["Close", "Circle"],
      expect: "Everyone helping out",
    },
  ],
};

/**
 * The six-screen tour. Shared by the Devpost set and the App Store set, which
 * differ only in capture size and output directory.
 */
const APP_TOUR = [
  { file: "01-onboarding.png", label: "onboarding" },
  {
    file: "02-today.png",
    label: "today",
    presses: [...SETUP_PRESSES, "Start from a template", "Confirm"],
    expect: "Today.s moments",
  },
  {
    file: "03-circle-free.png",
    label: "care circle (free)",
    press: "Circle",
    expect: "Unlimited shared notes",
  },
  {
    file: "04-paywall.png",
    label: "paywall",
    press: "Unlock with Pro",
    expect: "More room for care",
  },
  {
    file: "05-circle-pro.png",
    label: "care circle (Pro unlocked)",
    press: "Continue with Pro",
    expect: "Unlimited notes are on",
    // The app raises a "Collos Pro unlocked" toast for 2800ms and it sits
    // directly over the card this screenshot exists to show. Waiting it out
    // keeps the toast out of both this frame and the next one; the previous
    // 1400ms landed the toast right across the middle of the image.
    settleMs: 3050,
  },
  {
    file: "06-settings.png",
    label: "settings / store connection",
    press: "Settings",
    expect: "STORE CONNECTION",
  },
];

/**
 * `--skip-pro` drops the one step that cannot complete against the live app.
 *
 * Against a preview-mode build "Continue with Pro" is simulated and unlocks
 * instantly, so the tour runs end to end. Against app.collos.sithunyein.com it
 * opens RevenueCat's checkout, which this script does not drive — so the run
 * would abort at step 5 and silently leave
 * the Settings screenshot at whatever the previous build captured.
 *
 * Skipping that step lets the other five be captured from production, which is
 * the only way the Settings shot can show a real `Connected` store row and the
 * live `collos_pro` entitlement instead of the preview placeholders. The Pro
 * screenshot is then captured separately from the preview build.
 */
const SKIP_PRO = flag("skip-pro");
// The paywall step has to go with it: it leaves the modal open, and the next
// step's "Settings" press would land on the scrim instead of the tab bar. Run
// the paywall on its own with `--only 04-paywall`, where stopping the tour on
// the open modal is the point.
const TOUR = SKIP_PRO
  ? APP_TOUR.filter((step) => !step.file.startsWith("04") && !step.file.startsWith("05"))
  : APP_TOUR;

FLOWS.devpost = TOUR;
FLOWS.appstore = TOUR;
FLOWS.playstore = TOUR;

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- minimal DevTools-protocol client --------------------------------------
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      } else if (message.method && this.listeners.has(message.method)) {
        this.listeners.get(message.method)(message.params);
        this.listeners.delete(message.method);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve) => this.listeners.set(method, resolve));
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.text ?? "evaluate failed");
    return result.value;
  }

  async waitFor(expression, label, timeoutMs = 25000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (await this.evaluate(expression)) return;
      await sleep(200);
    }
    throw new Error(`Timed out waiting for ${label}`);
  }

  /**
   * Back to the top of every scrollable region.
   *
   * Presses scroll their target into view, and React Native Web scrolls a
   * `ScrollView` by moving its own div rather than the window — so without this
   * a step that pressed something low on the screen ("Confirm", on the first
   * plan row) would capture the page wherever that press left it, with the
   * header of the screen missing from the screenshot.
   */
  async resetScroll() {
    await this.evaluate(`(() => {
      window.scrollTo(0, 0);
      for (const el of document.querySelectorAll('div')) {
        if (el.scrollTop && el.scrollHeight > el.clientHeight) el.scrollTop = 0;
      }
      for (const el of document.querySelectorAll('div')) {
        if (el.scrollLeft && el.scrollWidth > el.clientWidth) el.scrollLeft = 0;
      }
      return true;
    })()`);
    await sleep(250);
  }

  /**
   * Type into a text field the way React notices.
   *
   * Assigning `input.value` goes through React's value tracker, which updates
   * the tracker's copy of the value at the same time — so the `input` event that
   * follows looks like no change and React discards it. Writing through the
   * prototype's own setter is what bypasses the tracker and makes the edit real.
   */
  async typeText(pattern, value) {
    const filled = await this.evaluate(`(() => {
      const re = new RegExp(${JSON.stringify(pattern)}, "i");
      const fields = [...document.querySelectorAll('input, textarea')];
      const el =
        fields.find((n) => re.test((n.getAttribute('aria-label') || n.placeholder || '').trim())) ||
        fields[0];
      if (!el) return "";
      el.focus();
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
      Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return el.value;
    })()`);
    if (!filled) throw new Error(`Could not type into a field matching ${JSON.stringify(pattern)}`);
    console.log(`  typed "${value}" into ${JSON.stringify(pattern)}`);
    await sleep(300);
  }

  async shoot(file) {
    await this.resetScroll();
    const { data } = await this.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const target = path.join(OUT_DIR, file);
    await writeFile(target, Buffer.from(data, "base64"));
    console.log(`  wrote ${path.relative(process.cwd(), target)}`);
  }

  /**
   * The best interactive element matching `pattern`.
   *
   * Accessibility roles differ per control (nav items are `tab`, plan rows are
   * `radio`), so query every interactive role and pick the *shortest* matching
   * text: that is the innermost, most specific element rather than a container
   * that happens to include the label.
   *
   * Both the visible text and the accessibility label are tested, and they have
   * to be tested separately rather than as one fallback chain. The chain was the
   * bug: an icon-only control renders a private-use glyph as its `innerText`, so
   * `innerText || aria-label` returned the glyph and the label was never read at
   * all — which made every `⋯`, every close button and every icon-only skip
   * unreachable by name, the moment rows included.
   */
  _finder(pattern) {
    return `(() => {
      const re = new RegExp(${JSON.stringify(pattern)}, "i");
      const nodes = [...document.querySelectorAll('[role="button"],[role="tab"],[role="radio"],[tabindex]')];
      const hits = nodes
        .filter((n) => re.test((n.innerText || '').trim()) || re.test(n.getAttribute('aria-label') || ''))
        .sort((a, b) => (a.innerText || '').trim().length - (b.innerText || '').trim().length);
      return hits[0] || null;
    })()`;
  }

  /**
   * Scrolls the target into view. Without this a press would be dispatched at a
   * y coordinate below the viewport and silently hit nothing.
   */
  async scrollTo(pattern) {
    const ok = await this.evaluate(
      `(() => { const el = ${this._finder(pattern)}; if (!el) return false;` +
        ` el.scrollIntoView({ block: 'center', inline: 'center' }); return true; })()`,
    );
    if (ok) await sleep(400);
    return ok;
  }

  /** Viewport coordinates of the centre of the best match. */
  async locate(pattern) {
    return this.evaluate(`(() => {
      const el = ${this._finder(pattern)};
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
  }

  /**
   * Press a point the way the running app expects it.
   *
   * React Native Web listens for touch/pointer events; a bare synthetic mouse
   * press does not always register, so try each strategy and verify the UI
   * actually reacted before returning.
   */
  async press(x, y, isDone, label) {
    const attempts = [
      [
        "touch",
        async () => {
          const touch = [{ x, y, radiusX: 8, radiusY: 8, force: 1 }];
          await this.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch });
          await sleep(60);
          await this.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        },
      ],
      [
        "mouse",
        async () => {
          const base = { x, y, button: "left", clickCount: 1 };
          await this.send("Input.dispatchMouseEvent", { type: "mousePressed", buttons: 1, ...base });
          await sleep(60);
          await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", buttons: 0, ...base });
        },
      ],
      [
        "click()",
        async () => {
          await this.evaluate(`(() => {
            const el = document.elementFromPoint(${x}, ${y});
            let node = el;
            while (node && node !== document.body) {
              if (node.getAttribute && (node.getAttribute('role') || node.onclick)) {
                node.click();
                return true;
              }
              node = node.parentElement;
            }
            if (el) el.click();
            return true;
          })()`);
        },
      ],
    ];

    for (const [name, fire] of attempts) {
      await fire();
      for (let i = 0; i < 20; i++) {
        await sleep(150);
        if (await this.evaluate(isDone)) {
          console.log(`  reached ${label} via ${name}`);
          return true;
        }
      }
    }
    return false;
  }
}

// --- run -------------------------------------------------------------------
const browserPath = BROWSERS.find((p) => existsSync(p));
if (!browserPath) {
  console.error("No Chrome or Edge found. Set CHROME_PATH to the executable.");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), "collos-shots-"));
const flow = FLOWS[SET];
const pixels = `${VIEWPORT.width * VIEWPORT.scale}x${VIEWPORT.height * VIEWPORT.scale}`;

console.log(`Capturing "${SET}" set from ${BASE_URL}`);
console.log(`  viewport ${VIEWPORT.width}x${VIEWPORT.height} @${VIEWPORT.scale}x -> ${pixels} px`);
console.log(`  out      ${path.relative(process.cwd(), OUT_DIR)}`);
console.log(`  browser  ${browserPath}`);

const browser = spawn(
  browserPath,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let cdp;
try {
  // Wait for the DevTools endpoint, then attach to the page target.
  let target = null;
  for (let i = 0; i < 100 && !target; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
      target = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    } catch {
      /* browser still starting */
    }
    if (!target) await sleep(200);
  }
  if (!target) throw new Error("DevTools endpoint never became available");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  cdp = new Cdp(ws);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: VIEWPORT.scale,
    mobile: true,
  });

  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: BASE_URL });
  await loaded;

  // Wait until the app has actually mounted, then let fonts settle.
  await cdp.waitFor(
    `!!document.getElementById('root') && document.getElementById('root').innerText.trim().length > 40`,
    "the app to render",
  );
  await cdp.evaluate("document.fonts && document.fonts.ready");
  await sleep(900);

  // `--only` narrows what gets written, and stops the tour once the last named
  // step is captured so a step that only exists for a later screenshot (like the
  // live purchase) never runs.
  const isSelected = (file) =>
    !ONLY || ONLY.split(",").some((token) => file.includes(token.trim()));
  const lastWanted = ONLY
    ? flow.reduce((last, step, index) => (isSelected(step.file) ? index : last), -1)
    : flow.length - 1;

  // A step either does nothing (it only captures what is on screen) or runs a
  // list of actions. Only the last one is verified against `expect`: the ones
  // before it are the setup for it, and a wrong answer there surfaces as the
  // last action failing to arrive.
  const actionsOf = (step) =>
    step.presses ?? (step.press ? [step.press] : []);

  for (const [index, step] of flow.entries()) {
    if (index > lastWanted) break;
    const actions = actionsOf(step);
    if (actions.length === 0) {
      console.log(`  ${step.label}`);
      await sleep(400);
    }
    for (const [position, action] of actions.entries()) {
      if (typeof action !== "string") {
        await cdp.typeText(action.type.label, action.type.value);
        continue;
      }
      if (!(await cdp.scrollTo(action))) {
        throw new Error(`Could not find a control matching ${JSON.stringify(action)}`);
      }
      const point = await cdp.locate(action);
      if (!point) throw new Error(`Could not measure a control matching ${JSON.stringify(action)}`);
      const isLast = position === actions.length - 1;
      // The app renders a curly apostrophe in "Today’s moments", so expect
      // patterns stay loose and are matched case-insensitively.
      const reacted = await cdp.press(
        point.x,
        point.y,
        isLast
          ? `new RegExp(${JSON.stringify(step.expect)}, "i").test(document.body.innerText)`
          : `true`,
        step.label,
      );
      if (!reacted) {
        const seen = await cdp.evaluate(
          `document.getElementById('root').innerText.slice(0, 200)`,
        );
        throw new Error(`Never reached ${step.label}. Screen read: ${JSON.stringify(seen)}`);
      }
      await sleep(isLast ? (step.settleMs ?? 900) : 500);
    }
    if (isSelected(step.file)) await cdp.shoot(step.file);
  }

  console.log("Done.");
} finally {
  cdp?.ws.close();
  browser.kill();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
