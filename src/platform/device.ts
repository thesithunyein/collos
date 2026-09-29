/**
 * What this build is actually running on, read from the app at runtime.
 *
 * The Settings screen shows these values so that anyone watching the demo — or
 * reading the repository — can tell the native app apart from the web export of
 * the same codebase. Nothing here is a hard-coded label: the platform, OS
 * version, device name and React Native runtime come from the process that is
 * being demoed, and the app identifier comes from `app.json`, which is also
 * what EAS reads when it builds the iOS and Android binaries.
 *
 * `expo-constants` would answer some of this, but it is only a transitive
 * dependency of the `expo` meta-package, and this project deliberately reads
 * nothing it has not pinned (see the `expo-font` incident in README's
 * "What was hard"). `Platform` is part of `react-native` itself, so this file
 * adds no entry to the dependency tree at all.
 */
import { Platform } from "react-native";
import appConfig from "../../app.json";

/**
 * The subset of `Platform.constants` we read. Each key exists on at least one
 * platform but not all of them (`Release` and `Model` are Android-only,
 * `interfaceIdiom` is iOS-only), so every field is optional.
 */
type PlatformConstants = {
  osVersion?: string | number;
  Release?: string;
  Model?: string;
  Manufacturer?: string;
  interfaceIdiom?: string;
  reactNativeVersion?: { major: number; minor: number; patch: number };
};

const constants = (Platform.constants ?? {}) as PlatformConstants;

/** Version from `app.json`, the same value EAS stamps into a native build. */
export const appVersion: string = appConfig.expo.version;

/** The iOS bundle identifier and Android package, identical in this project. */
export const appIdentifier: string =
  appConfig.expo.ios.bundleIdentifier ?? appConfig.expo.android.package;

export type DeviceRow = { label: string; value: string; mono?: boolean };

/** `iOS 18.5` / `Android 14 (API 34)` / `Web (browser)`. */
function platformLabel(): string {
  const version =
    typeof Platform.Version === "number" || typeof Platform.Version === "string"
      ? String(Platform.Version)
      : "";

  if (Platform.OS === "ios") return version ? `iOS ${version}` : "iOS";
  if (Platform.OS === "android") {
    const name = constants.Release ? `Android ${constants.Release}` : "Android";
    return version ? `${name} (API ${version})` : name;
  }
  return "Web (browser)";
}

/** `iPhone` / `iPad` / `samsung SM-G991B` / `Desktop browser`. */
function deviceLabel(): string {
  if (Platform.OS === "ios") return constants.interfaceIdiom === "pad" ? "iPad" : "iPhone";
  if (Platform.OS === "android") {
    const name = `${constants.Manufacturer ?? ""} ${constants.Model ?? ""}`.trim();
    return name.length > 0 ? name : "Android device";
  }
  return "Desktop browser";
}

/** The React Native runtime version, e.g. `0.74.5`. */
function reactNativeLabel(): string {
  const version = constants.reactNativeVersion;
  if (!version) return "unavailable";
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * `Native iOS` / `Native Android` on a device, `Web export` in a browser. This
 * is the row that settles the "is it a web app?" question on camera.
 */
function runtimeLabel(): string {
  if (Platform.OS === "ios") return "Native iOS app";
  if (Platform.OS === "android") return "Native Android app";
  return "Web export of the same app";
}

/**
 * Rows for the Settings screen's "This device" card. Ordered platform-first so
 * a screenshot of the card is self-contained evidence.
 */
export function deviceRows(): DeviceRow[] {
  return [
    { label: "Platform", value: platformLabel() },
    { label: "Device", value: deviceLabel() },
    { label: "Runtime", value: runtimeLabel() },
    { label: "React Native", value: reactNativeLabel() },
    { label: "App identifier", value: appIdentifier, mono: true },
    { label: "Version", value: appVersion },
  ];
}
