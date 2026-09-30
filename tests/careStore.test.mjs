/**
 * Behaviour tests for `src/storage/careStore.ts` — the app's state engine.
 *
 * These run the real TypeScript source through the loader in
 * `support/load-ts.mjs`, with the storage layer swapped for an in-memory
 * double that honours the same contract. Nothing here tests a copy: if a
 * behaviour below starts failing in the app, it fails here first.
 *
 * Each `test` names the behaviour it pins, not the function it calls — a
 * function can be renamed; a promise like "a move resets the status" is the
 * thing that must keep holding.
 *
 * Two dates are used as fixed ground truth, chosen so the weekday arithmetic
 * is unmistakable: 2026-10-05 is a Monday, 2026-10-03 a Saturday.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { loadCareStore } from "./support/load-ts.mjs";
import { reset, failNext, peekRaw, write as rawWrite } from "./support/fileStore-double.mjs";

const store = await loadCareStore();

const MONDAY = new Date(2026, 9, 5); // 2026-10-05, a Monday
const SATURDAY = new Date(2026, 9, 3); // 2026-10-03, a Saturday

/** A state with one recipient and one daily moment, the common scaffold. */
function seeded() {
  let state = store.emptyStoredState();
  state = store.withAddedRecipient(state, { name: "Margaret", relationship: "Mum" });
  const recipientId = state.activeRecipientId;
  state = store.withMoment(state, recipientId, {
    id: "water-break",
    title: "Water break",
    detail: "",
    time: "10:30 AM",
    icon: "water-outline",
    tone: "orange",
  });
  return { state, recipientId };
}

test.afterEach(() => reset());

/* --- the empty state and its version --------------------------------------- */

test("a fresh state is version 2 with nothing in it", () => {
  const state = store.emptyStoredState();
  assert.equal(state.version, 2);
  assert.deepEqual(state.recipients, []);
  assert.deepEqual(state.moments, {});
  assert.deepEqual(state.deferred, {});
  assert.deepEqual(state.notes, []);
  assert.equal(state.activeRecipientId, null);
  assert.equal(state.seenOnboarding, false);
});

/* --- serialisation: the never-throws promises ------------------------------- */

test("a round trip through storage preserves the state, JSON-exact", async () => {
  const { state } = seeded();
  const confirmed = store.withTaskStatus(state, state.activeRecipientId, "water-break", "confirmed");
  assert.ok(await store.saveStoredState(confirmed));
  const reloaded = await store.loadStoredState();
  // JSON-exact, deliberately: the store's promise is that the *payload*
  // survives, and a JSON payload cannot carry an `undefined` key. (In memory
  // `withAddedRecipient` leaves `portraitId: undefined` when no portrait was
  // chosen; the serialised state — the thing on disk — correctly omits it.)
  // Every field that means something survives the trip:
  assert.deepEqual(reloaded, JSON.parse(JSON.stringify(confirmed)));
  assert.equal(reloaded.recipients[0].name, "Margaret");
  assert.equal(reloaded.statuses[state.activeRecipientId]["water-break"], "confirmed");
  assert.equal(reloaded.seenOnboarding, true);
});

test("a corrupt payload reads as no state, not a crash", async () => {
  await rawWrite("{not json at all");
  assert.equal(await store.loadStoredState(), null);
});

test("a v1 payload is refused, not half-migrated", async () => {
  await rawWrite(JSON.stringify({ version: 1, recipients: [], notes: [] }));
  assert.equal(await store.loadStoredState(), null);
});

test("a failed read degrades to no state and never throws", async () => {
  failNext("read");
  assert.equal(await store.loadStoredState(), null);
});

test("a failed write reports false and never throws", async () => {
  failNext("write");
  assert.equal(await store.saveStoredState(store.emptyStoredState()), false);
});

test("the serialised payload really is the stored shape on disk", async () => {
  const { state } = seeded();
  await store.saveStoredState(state);
  const raw = peekRaw();
  assert.ok(raw.startsWith('{"version":2,'));
  assert.ok(raw.includes('"water-break"'));
});

/* --- people ----------------------------------------------------------------- */

test("initials take the first letter of each of the first two words", () => {
  assert.equal(store.initialsFrom("Mary Anne Jones"), "MA");
  assert.equal(store.initialsFrom("Margaret"), "M");
  assert.equal(store.initialsFrom("   "), "?");
});

test("adding a recipient trims the fields and makes them active", () => {
  const state = store.withAddedRecipient(store.emptyStoredState(), {
    name: "  Margaret  ",
    relationship: "  Mum ",
  });
  assert.equal(state.recipients.length, 1);
  assert.equal(state.recipients[0].name, "Margaret");
  assert.equal(state.recipients[0].relationship, "Mum");
  assert.equal(state.activeRecipientId, state.recipients[0].id);
  assert.equal(state.seenOnboarding, true);
});

test("recipients render with initials and their chosen portrait", () => {
  const state = store.withAddedRecipient(store.emptyStoredState(), {
    name: "Margaret Nyein",
    relationship: "Mum",
    portraitId: "margaret",
  });
  const rendered = store.careRecipients(state);
  assert.equal(rendered[0].initials, "MN");
  assert.ok(rendered[0].portrait, "portrait resolved from PORTRAITS");
});

/* --- today's plan: repeat rules and the deferred map ------------------------ */

test("a daily moment is on the plan on any day, open by default", () => {
  const { state, recipientId } = seeded();
  const saturday = store.tasksForRecipientOn(state, recipientId, SATURDAY);
  assert.equal(saturday.length, 1);
  assert.equal(saturday[0].status, "not-confirmed");
});

test("a weekdays-only moment is on the plan on Monday and off on Saturday", () => {
  const { state, recipientId } = seeded();
  const weekdays = store.withEditedMoment(state, recipientId, "water-break", { repeat: "weekdays" });
  assert.equal(store.tasksForRecipientOn(weekdays, recipientId, MONDAY).length, 1);
  assert.equal(store.tasksForRecipientOn(weekdays, recipientId, SATURDAY).length, 0);
  // …but it is still on the *plan*: Settings says "3 moments" even on a Saturday.
  assert.equal(store.allMomentsForRecipient(weekdays, recipientId).length, 1);
});

test("a null recipient has an empty plan rather than an error", () => {
  assert.deepEqual(store.tasksForRecipientOn(store.emptyStoredState(), null, MONDAY), []);
});

test("a moment moved to tomorrow leaves today and appears on its day", () => {
  const { state, recipientId } = seeded();
  const moved = store.withDeferredMoment(state, recipientId, "water-break", "2026-10-06");
  assert.equal(store.tasksForRecipientOn(moved, recipientId, MONDAY).length, 0);
  const tuesday = new Date(2026, 9, 6);
  const onTuesday = store.tasksForRecipientOn(moved, recipientId, tuesday);
  assert.equal(onTuesday.length, 1);
  assert.equal(store.deferredDayFor(moved, recipientId, "water-break"), "2026-10-06");
});

test("a moment whose moved-to day has passed becomes an ordinary moment again", () => {
  const { state, recipientId } = seeded();
  // Moved to last Friday; today (Monday) it is simply back on the daily plan.
  const moved = store.withDeferredMoment(state, recipientId, "water-break", "2026-10-02");
  assert.equal(store.tasksForRecipientOn(moved, recipientId, MONDAY).length, 1);
});

test("moving a moment resets it to open — a skip can never tick a future day", () => {
  const { state, recipientId } = seeded();
  const confirmed = store.withTaskStatus(state, recipientId, "water-break", "confirmed");
  const moved = store.withDeferredMoment(confirmed, recipientId, "water-break", "2026-10-06");
  const onTuesday = store.tasksForRecipientOn(moved, recipientId, new Date(2026, 9, 6));
  assert.equal(onTuesday[0].status, "not-confirmed");
});

test("bringing a moment back clears the move and it is on today's plan", () => {
  const { state, recipientId } = seeded();
  const moved = store.withDeferredMoment(state, recipientId, "water-break", "2026-10-06");
  const back = store.withDeferredMoment(moved, recipientId, "water-break", null);
  assert.equal(store.deferredDayFor(back, recipientId, "water-break"), null);
  assert.equal(store.tasksForRecipientOn(back, recipientId, MONDAY).length, 1);
});

/* --- editing and removing ---------------------------------------------------- */

test("editing a moment keeps its id, so its status survives the rename", () => {
  const { state, recipientId } = seeded();
  const confirmed = store.withTaskStatus(state, recipientId, "water-break", "confirmed");
  const renamed = store.withEditedMoment(confirmed, recipientId, "water-break", {
    title: "Hydration break",
  });
  const [moment] = store.allMomentsForRecipient(renamed, recipientId);
  assert.equal(moment.id, "water-break");
  assert.equal(moment.title, "Hydration break");
  assert.equal(moment.status, "confirmed");
});

test("editing a moment clears any pending move", () => {
  const { state, recipientId } = seeded();
  const moved = store.withDeferredMoment(state, recipientId, "water-break", "2026-10-06");
  const edited = store.withEditedMoment(moved, recipientId, "water-break", { title: "New name" });
  assert.equal(store.deferredDayFor(edited, recipientId, "water-break"), null);
  assert.equal(store.tasksForRecipientOn(edited, recipientId, MONDAY).length, 1);
});

test("removing a moment removes its status and its move with it", () => {
  const { state, recipientId } = seeded();
  const confirmed = store.withTaskStatus(state, recipientId, "water-break", "confirmed");
  const moved = store.withDeferredMoment(confirmed, recipientId, "water-break", "2026-10-06");
  const removed = store.withRemovedMoment(moved, recipientId, "water-break");
  assert.deepEqual(store.allMomentsForRecipient(removed, recipientId), []);
  assert.deepEqual(store.tasksForRecipientOn(removed, recipientId, new Date(2026, 9, 6)), []);
  assert.equal(store.deferredDayFor(removed, recipientId, "water-break"), null);
});

/* --- the starter plan --------------------------------------------------------- */

test("the starter plan arrives at 0 of 4, not pre-ticked", () => {
  const { state, recipientId } = seeded();
  const started = store.withStarterMoments(store.emptyStoredState(), recipientId);
  const plan = store.tasksForRecipientOn(started, recipientId, SATURDAY); // all daily
  assert.equal(plan.length, 4);
  assert.ok(plan.every((moment) => moment.status === "not-confirmed"));
});

test("starting from the template twice neither duplicates nor unticks", () => {
  const { state, recipientId } = seeded();
  const started = store.withStarterMoments(state, recipientId);
  const confirmed = store.withTaskStatus(started, recipientId, "morning-check-in", "confirmed");
  const again = store.withStarterMoments(confirmed, recipientId);
  const plan = store.allMomentsForRecipient(again, recipientId);
  assert.equal(plan.filter((m) => m.id === "morning-check-in").length, 1);
  assert.equal(plan.find((m) => m.id === "morning-check-in").status, "confirmed");
});

/* --- the day and the words for it ---------------------------------------------- */

test("resetting the day opens every moment and keeps the plan", () => {
  const { state, recipientId } = seeded();
  const confirmed = store.withTaskStatus(state, recipientId, "water-break", "confirmed");
  const reset = store.withResetDay(confirmed, recipientId);
  assert.equal(store.allMomentsForRecipient(reset, recipientId)[0].status, "not-confirmed");
  assert.equal(store.allMomentsForRecipient(reset, recipientId).length, 1);
});

test("day keys are local calendar dates, zero-padded", () => {
  assert.equal(store.dayKey(new Date(2026, 9, 1)), "2026-10-01");
  assert.equal(store.dayKey(new Date(2026, 0, 5)), "2026-01-05");
});

test("moved days are described relative to now, and a far day by date", () => {
  assert.equal(store.describeDay(store.dayKeyFromNow(0)), "today");
  assert.equal(store.describeDay(store.dayKeyFromNow(1)), "tomorrow");
  assert.equal(store.describeDay(store.dayKeyFromNow(-1)), "yesterday");
  const far = store.describeDay(store.dayKeyFromNow(8));
  assert.ok(!["today", "tomorrow", "yesterday"].includes(far));
  assert.match(store.dayKeyFromNow(3), /^\d{4}-\d{2}-\d{2}$/);
});

/* --- notes: the one thing Pro lifts --------------------------------------------- */

test("the free plan allows exactly one note a day, then reports none left", () => {
  const { state, recipientId } = seeded();
  assert.equal(store.FREE_NOTES_PER_DAY, 1);
  assert.equal(store.notesLeftToday(state, recipientId), 1);
  const one = store.withAddedNote(state, recipientId, "Slept well");
  assert.equal(store.notesLeftToday(one, recipientId), 0);
  const two = store.withAddedNote(one, recipientId, "Second try");
  assert.equal(store.notesLeftToday(two, recipientId), 0, "never negative");
});

test("notes are newest first and kept per person", () => {
  const { state, recipientId } = seeded();
  const other = `person-${Date.now().toString(36)}-x`;
  const one = store.withAddedNote(state, recipientId, "first");
  const two = store.withAddedNote(one, recipientId, "second");
  const otherNote = store.withAddedNote(two, other, "for someone else");
  const notes = store.notesForRecipient(otherNote, recipientId);
  assert.deepEqual(notes.map((n) => n.text), ["second", "first"]);
  assert.equal(store.notesForRecipient(otherNote, other).length, 1);
  assert.deepEqual(store.notesForRecipient(otherNote, null), []);
});
