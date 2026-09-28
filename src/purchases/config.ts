import { Platform } from "react-native";

/**
 * Metro inlines `process.env.EXPO_PUBLIC_*` at build time, but only for *static*
 * member access — a dynamic `process.env[name]` lookup would silently evaluate to
 * `undefined` in the bundle. Declaring the shape we read keeps those accesses
 * static and type-safe without relying on whichever ambient `process` typings
 * happen to be installed.
 */
declare const process: { env: Record<string, string | undefined> };

/**
 * RevenueCat configuration.
 *
 * Every value is read from an `EXPO_PUBLIC_*` environment variable so Metro can
 * inline it at build time. Nothing here throws when the variables are missing:
 * with no key the app runs in `preview` mode instead of crashing, which keeps
 * the public web demo working before a RevenueCat project exists.
 */

function readEnv(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Public SDK keys, one per store. The Apple/Google keys are not secrets. */
export const revenueCatKeys = {
  ios: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY),
  android: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY),
  web: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY),
} as const;


/** Entitlement that unlocks Collos Pro. Must match the RevenueCat dashboard. */
export const PRO_ENTITLEMENT =
  readEnv(process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT) ?? "pro";

/**
 * RevenueCat project ID (`prj_...`). Required by the Shipaton submission form,
 * and surfaced in Settings so it is easy to copy into Devpost.
 */
export const REVENUECAT_PROJECT_ID =
  readEnv(process.env.EXPO_PUBLIC_REVENUECAT_PROJECT_ID) ?? "";

export type SupportedPlatform = "ios" | "android" | "web";

export function activePlatform(): SupportedPlatform | null {
  if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
    return Platform.OS;
  }
  return null;
}

/** The public SDK key for the platform the app is currently running on. */
export function activeApiKey(): string | undefined {
  const platform = activePlatform();
  return platform ? revenueCatKeys[platform] : undefined;
}

/** True when a key exists for this platform, i.e. real store calls are possible. */
export function isPaymentsConfigured(): boolean {
  return activeApiKey() !== undefined;
}

/** Store name shown next to prices so the user knows who bills them. */
export function storeDisplayName(): string {
  switch (Platform.OS) {
    case "ios":
      return "App Store";
    case "android":
      return "Google Play";
    case "web":
      return "RevenueCat Billing";
    default:
      return "this store";
  }
}

/** Which platforms still need a key, used by the Settings diagnostics panel. */
export function missingKeyPlatforms(): SupportedPlatform[] {
  return (["ios", "android", "web"] as SupportedPlatform[]).filter(
    (platform) => revenueCatKeys[platform] === undefined,
  );
}
