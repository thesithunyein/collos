/**
 * The storage double the test loader swaps in for `fileStore.ts`.
 *
 * Same contract as the real thing — `read(): Promise<string|null>`,
 * `write(value): Promise<boolean>`, `clear(): Promise<boolean>` — over one
 * in-memory string, plus two test-only helpers the real implementation cannot
 * offer honestly: reset the contents, and make the next call fail.
 *
 * The failure switches exist because `careStore.ts` promises, in prose, that
 * storage problems never take the app down: a failed read is "no state yet", a
 * failed write is `false`, and neither throws. A promise like that is exactly
 * the kind of thing that rots unnoticed, so the suite exercises it the only
 * way it can be exercised — by making storage actually fail.
 *
 * The defaults are the happy path, so a test that forgets to arm a switch
 * tests normal storage rather than nothing.
 */
let contents = null;
let failNextRead = false;
let failNextWrite = false;

export async function read() {
  if (failNextRead) {
    failNextRead = false;
    throw new Error("storage unavailable (armed by test)");
  }
  return contents;
}

export async function write(value) {
  if (failNextWrite) {
    failNextWrite = false;
    throw new Error("storage unavailable (armed by test)");
  }
  contents = value;
  return true;
}

export async function clear() {
  contents = null;
  return true;
}

/** Test-only: return to a clean slate between tests. */
export function reset() {
  contents = null;
  failNextRead = false;
  failNextWrite = false;
}

/** Test-only: arm one failure. `kind` is `"read"` or `"write"`. */
export function failNext(kind) {
  if (kind === "read") failNextRead = true;
  if (kind === "write") failNextWrite = true;
}

/** Test-only: the exact serialised payload, for round-trip assertions. */
export function peekRaw() {
  return contents;
}
