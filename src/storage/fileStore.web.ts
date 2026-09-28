/**
 * Storage primitive — web implementation.
 *
 * Metro resolves `careStore`'s `./fileStore` import to this file on web. It
 * deliberately does not import `expo-file-system`: SDK 51's web implementation
 * is a shim whose `documentDirectory` is `null`, so it cannot store anything.
 * `localStorage` is the platform-correct equivalent — synchronous, persistent
 * across reloads, and scoped per browser profile.
 *
 * Private-browsing modes throw on `setItem`; the caller (`careStore`) treats a
 * failed write as non-fatal and keeps the session in memory, so the app works
 * everywhere and simply does not persist where the browser forbids it.
 */
import { fileStoreKey } from "./fileStoreKey";

export async function read(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(fileStoreKey());
}

export async function write(value: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  window.localStorage.setItem(fileStoreKey(), value);
  return true;
}

export async function clear(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  window.localStorage.removeItem(fileStoreKey());
  return true;
}
