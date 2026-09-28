/**
 * Storage primitive — native implementation (iOS / Android).
 *
 * Chosen by Metro's platform resolution: `careStore.ts` imports `./fileStore`
 * and gets this file on native, `fileStore.web.ts` in the browser.
 *
 * Uses `expo-file-system`, which is already in the dependency tree as a direct
 * dependency of `expo` — no new package, no new version risk. The JSON state is
 * one small file in the app's documents directory.
 */
import * as FileSystem from "expo-file-system";

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
