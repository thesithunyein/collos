#!/usr/bin/env node
/**
 * Capture real screenshots of the running Collos app for the landing page.
 *
 * The landing page used to hand-build a CSS imitation of the dashboard, which
 * silently drifted from the app (it advertised "50%" and "2 of 4 confirmed"
 * long after the app showed "25%" and "1 of 4"). These PNGs are captured from
 * the app itself, so the landing page cannot contradict it.
 *
 * Usage:
 *   node scripts/capture-app-screenshots.mjs
 *   node scripts/capture-app-screenshots.mjs --base-url http://localhost:8081 --out-dir landing
 *
 * Requires a local Chrome or Edge. Override with CHROME_PATH if neither is
 * found in the usual places. No npm dependencies: it talks to the browser over
 * the DevTools protocol using Node's built-in WebSocket.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// --- options ---------------------------------------------------------------
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const BASE_URL = arg("base-url", "https://app.collos.sithunyein.com/");
const OUT_DIR = path.resolve(arg("out-dir", "landing"));
const PORT = Number(arg("port", "9333"));

// Capture at a real phone viewport, at 2x for retina-crisp output.
const VIEWPORT = { width: 390, height: 844, scale: 2 };

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

  async shoot(file) {
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
            const el = [...document.querySelectorAll('[role="button"]')]
              .find((n) => /Set up my care circle/.test(n.innerText || ''));
            if (el) el.click();
            return true;
          })()`);
        },
      ],
    ];

    for (const [name, fire] of attempts) {
      await fire();
      for (let i = 0; i < 15; i++) {
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

const profile = await mkdtemp(path.join(tmpdir(), "collos-shots-"));
console.log(`Capturing ${BASE_URL}`);
console.log(`  browser ${browserPath}`);

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

  console.log("  onboarding screen");
  await cdp.shoot("app-onboarding.png");

  // Drive the real UI: press "Set up my care circle".
  const button = await cdp.evaluate(`(() => {
    const el = [...document.querySelectorAll('[role="button"]')]
      .find((n) => /Set up my care circle/.test(n.innerText || ''));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!button) throw new Error("Could not find the onboarding button");

  // The app renders a curly apostrophe in "Today’s moments", so match loosely.
  const onDashboard = `/Today.s moments/.test(document.body.innerText)`;

  const reached = await cdp.press(button.x, button.y, onDashboard, "the dashboard");
  if (!reached) {
    const seen = await cdp.evaluate(
      `document.getElementById('root').innerText.slice(0, 160)`,
    );
    throw new Error(`Never reached the dashboard. Screen read: ${JSON.stringify(seen)}`);
  }
  await sleep(900);

  console.log("  dashboard screen");
  await cdp.shoot("app-dashboard.png");

  console.log("Done.");
} finally {
  cdp?.ws.close();
  browser.kill();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
