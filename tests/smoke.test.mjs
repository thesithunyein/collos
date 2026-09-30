/**
 * Smoke test for the loader itself: if this fails, the problem is the test
 * harness, not the app. Kept separate so a harness failure is named as one.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { loadCareStore } from "./support/load-ts.mjs";

test("the real careStore source loads under Node with the storage double", async () => {
  const store = await loadCareStore();
  assert.equal(typeof store.emptyStoredState, "function");
  assert.equal(typeof store.withDeferredMoment, "function");

  const state = store.emptyStoredState();
  assert.equal(state.version, 2);
  assert.deepEqual(state.deferred, {});
});

test("the double is really in place, not expo-file-system", async () => {
  const store = await loadCareStore();
  const { peekRaw, reset } = await import("./support/fileStore-double.mjs");
  reset();

  const state = store.emptyStoredState();
  await store.saveStoredState(state);
  assert.ok(peekRaw()?.includes('"version":2'));
  assert.deepEqual(await store.loadStoredState(), state);
});
