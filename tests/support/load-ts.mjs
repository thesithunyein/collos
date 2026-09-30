/**
 * Loads the app's real TypeScript source in Node, uncompiled and untransformed
 * beyond type-stripping — so the suite tests the code that ships, not a copy
 * of it that could drift.
 *
 * How it works: `module.register()` hooks Node's own module pipeline (hooks
 * themselves live in `hook-cjs.mjs`, which Node loads in a dedicated thread).
 * Any `file:…*.ts` import is type-stripped with the app's own `typescript`
 * devDependency — `transpileModule`, single-file, the same kind of transform
 * Metro's Babel step does for types — and loaded as ESM. Nothing else is
 * rewritten: relative imports inside `src/` resolve the way they do in the app.
 *
 * Two remaps exist because two imports cannot run under plain Node, and both
 * are honest stands rather than approximations of the app's logic:
 *
 * - `fileStore` → the in-memory double in `fileStore-double.mjs`. The double
 *   implements the exact contract `careStore.ts` compiles against, so the
 *   store is tested against the interface it actually uses, not against
 *   `localStorage` or `expo-file-system`.
 * - image `require()` calls in `src/data/care.ts` → a tiny object. The real
 *   ones are resolved by Metro into bundled asset references; here a portrait
 *   is never dereferenced, only carried.
 *
 * The transform is type-stripping only, like Node's own TS support: no enum,
 * no namespace, no parameter properties. The app's storage layer uses none of
 * those, so `npm run typecheck` remains the gate for types and this suite is
 * the gate for behaviour — neither pretends to do the other's job.
 */
import { register } from "node:module";

const SOURCE_URL = new URL("../../src/storage/careStore.ts", import.meta.url).href;

// An absolute file URL for the hook module itself: `register()`'s parentURL
// form needs a trailing slash to be treated as a directory, and not having
// one is exactly the bug this avoids.
register(new URL("./hook-cjs.mjs", import.meta.url).href);

/**
 * Imports `src/storage/careStore.ts` with the storage double wired in. Every
 * test gets the store through this one door, so no test can accidentally end
 * up against the real `expo-file-system` implementation. The `?storage=double`
 * query makes the module identity explicit; the hook matches on it.
 */
export async function loadCareStore() {
  return import(`${SOURCE_URL}?storage=double`);
}
