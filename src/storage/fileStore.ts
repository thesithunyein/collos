/**
 * Storage primitive — native implementation (iOS / Android).
 *
 * Chosen by Metro's platform resolution: `careStore.ts` imports `./fileStore`
 * and gets this file on native, `fileStore.web.ts` in the browser.
 *
 * Uses `expo-file-system`, and the JSON state is one small file in the app's
 * documents directory.
 *
 * ## Why the import names `/legacy`
 *
 * `expo-file-system@19` (`2025-08-13`, SDK 54) made the modern `File` / `Directory`
 * API the default and moved the previous one to `expo-file-system/legacy`. The old
 * functions still exist on the package root, but they are marked *"This method will
 * throw in runtime"* — they are compatibility stubs, not implementations — so
 * importing from the root compiles cleanly, passes typecheck, and then throws on a
 * phone the first time the app reads its state. `expo-file-system/legacy` is the
 * real implementation of the functions used below.
 *
 * `expo-file-system` also stopped being a transitive dependency of `expo` at SDK
 * 54, so it is now a direct dependency in `package.json` rather than something the
 * tree happened to provide.
 *
 * Moving to the `File` API is a deliberate, separate piece of work rather than
 * something to fold into an SDK upgrade: it changes every call in this file, and
 * the legacy path is tested.
 */
import * as FileSystem from "expo-file-system/legacy";

const FILE_NAME = "care-state.json";

export async function read(): Promise<string | null> {
  const directory = FileSystem.documentDirectory;
  if (!directory) return null;
  const path = directory + FILE_NAME;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  return FileSystem.readAsStringAsync(path);
}

export async function write(value: string): Promise<boolean> {
  const directory = FileSystem.documentDirectory;
  if (!directory) return false;
  await FileSystem.writeAsStringAsync(directory + FILE_NAME, value, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return true;
}

export async function clear(): Promise<boolean> {
  const directory = FileSystem.documentDirectory;
  if (!directory) return false;
  await FileSystem.deleteAsync(directory + FILE_NAME, { idempotent: true });
  return true;
}
