import {
  CareRecipient,
  CareTask,
  PORTRAITS,
  STARTER_MOMENTS,
  TaskStatus,
  TaskTemplate,
} from "../data/mockCare";
import * as fileStore from "./fileStore";

/**
 * Device-local persistence for the care plan.
 *
 * Before this module the whole app lived in `useState`: confirming a task and
 * reloading the page made the app forget it. Now every status change survives a
 * restart, on web and on device.
 *
 * The point is deliberately *device-local*: nothing leaves the device, which
 * matches what the privacy policy and the store listing actually claim. Sharing a
 * plan between two phones is a different feature (a backend), and the docs keep
 * saying so rather than drifting into "shared".
 *
 * Zero new packages. The storage primitive is split by platform file
 * (`fileStore.web.ts` / `fileStore.ts`), the standard Expo convention: Metro
 * picks the `.web` implementation for the browser bundle and the native one for
 * devices. SDK 51's web implementation of `expo-file-system` is a shim whose
 * `documentDirectory` is `null`, so on web this is `localStorage` directly.
 *
 * Every storage call is wrapped: a failed read or write degrades to an
 * in-memory session exactly like the RevenueCat wrapper degrades to preview
 * mode. Storage problems must never take the app down.
 *
 * ## Why recipients are here too
 *
 * The people in the plan used to be a module constant alongside the moments, so
 * a brand-new install opened on two strangers and a day that was already 25%
 * done — one of them pre-confirmed before the user had seen the app. There was
 * also nothing that could create a person. Both are stored state now: the user
 * names who they are caring for during setup, and a plan that is empty is empty
 * because it is theirs.
 */

/**
 * A payload from before recipients were stored (v1) is refused rather than
 * migrated. Its people were the built-in pair and its moments were their
 * moments, so there is nothing in it that belongs to the user; the honest
 * outcome is a fresh setup, which takes one screen to complete. A v2 payload
 * under the v1 key is still read — the version field is the guard, not the key.
 */
const VERSION = 2;

export type StoredRecipient = {
  id: string;
  name: string;
  relationship: string;
  /** Id from `PORTRAITS`. Absent means the initials fallback in `Avatar`. */
  portraitId?: string;
};

export type StoredNote = {
  id: string;
  recipientId: string;
  text: string;
  /** Local calendar day, `YYYY-MM-DD`. Drives the free plan's one-a-day limit. */
  day: string;
  /** ISO timestamp, for ordering. */
  createdAt: string;
};

export type StoredState = {
  version: 2;
  /** The people the user cares for, in the order they were added. */
  recipients: StoredRecipient[];
  /**
   * The person holding the phone. Collos is used by someone *about* someone
   * else, and every screen speaks from that person — the greeting, the circle
   * card, the "checked in" count — so it has to be stored like any other fact
   * rather than compiled in. Empty until setup asks for it.
   */
  organiserName: string;
  /** Per recipient, per moment: the last status the user chose for it. */
  statuses: Record<string, Record<string, TaskStatus>>;
  /**
   * Every moment on a person's plan — added by hand or copied from a template.
   *
   * One list, not "built-ins plus additions": a template stops being a
   * different kind of thing the moment it is put on a plan, and keeping them
   * apart meant two code paths that could disagree about status.
   */
  moments: Record<string, TaskTemplate[]>;
  /** Notes left for whoever picks up the plan next. Newest first. */
  notes: StoredNote[];
  /** The person last viewed, so a restart reopens the same plan. */
  activeRecipientId: string | null;
  seenOnboarding: boolean;
};

/**
 * The free plan keeps one note a day; Collos Pro keeps as many as you like.
 * This is the entitlement's only paid feature, so it has to be enforced for
 * real rather than described.
 */
export const FREE_NOTES_PER_DAY = 1;

export function emptyStoredState(): StoredState {
  return {
    version: VERSION,
    recipients: [],
    organiserName: "",
    statuses: {},
    moments: {},
    notes: [],
    activeRecipientId: null,
    seenOnboarding: false,
  };
}

/* --- serialisation --------------------------------------------------------- */

function parse(raw: string | null): StoredState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.version !== VERSION || typeof parsed !== "object") return null;
    return {
      version: VERSION,
      recipients: Array.isArray(parsed.recipients)
        ? parsed.recipients.filter(
            (item) => item && typeof item.id === "string" && typeof item.name === "string",
          )
        : [],
      statuses: parsed.statuses ?? {},
      // Notes arrived after v1 shipped, so an older payload must still load.
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      // `organiserName` also postdates v1: the greeting used to be compiled
      // from a constant. Existing payloads keep working with an empty name,
      // which the UI renders as a neutral greeting rather than a wrong one.
      organiserName: typeof parsed.organiserName === "string" ? parsed.organiserName : "",
      moments: parsed.moments ?? {},
      activeRecipientId: parsed.activeRecipientId ?? null,
      seenOnboarding: Boolean(parsed.seenOnboarding),
    };
  } catch {
    return null;
  }
}

/** Never throws. A broken store reads as "no state yet". */
export async function loadStoredState(): Promise<StoredState | null> {
  try {
    return parse(await fileStore.read());
  } catch {
    return null;
  }
}

/** Never throws. Returns false when nothing could be written. */
export async function saveStoredState(state: StoredState): Promise<boolean> {
  let payload: string;
  try {
    payload = JSON.stringify(state);
  } catch {
    return false;
  }
  try {
    return await fileStore.write(payload);
  } catch {
    return false;
  }
}

/** Never throws. Returns false when the data could not be removed. */
export async function clearStoredState(): Promise<boolean> {
  try {
    return await fileStore.clear();
  } catch {
    return false;
  }
}

/* --- people ---------------------------------------------------------------- */

/**
 * Initials for the fallback in `Avatar`. Two words give two letters, so
 * "Mary Anne" reads as a person rather than as the start of a word.
 */
export function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.slice(0, 2).map((word) => word[0]);
  return letters.join("").toUpperCase();
}

/** The stored people, as the screens render them. */
export function careRecipients(state: StoredState): CareRecipient[] {
  return state.recipients.map((item) => ({
    id: item.id,
    name: item.name,
    relationship: item.relationship,
    initials: initialsFrom(item.name),
    portrait: PORTRAITS.find((portrait) => portrait.id === item.portraitId)?.source,
  }));
}

export function newRecipientId(): string {
  return `person-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Adds a person and makes them the active plan.
 *
 * The new plan is deliberately empty. A person is not a moment, and there is no
 * description of a day that is right for someone the app has never been told
 * anything about — so the first thing the user sees is their own empty screen
 * with one obvious way out of it, not somebody else's finished one.
 *
 * The first person a user defines is the care *recipient*; the organiser is the
 * person holding the phone, captured separately. Setup asks for the recipient
 * because a plan without a subject is unrenderable, while the organiser's own
 * name only changes how the app speaks — the empty-string fallback covers it.
 */
export function withAddedRecipient(
  state: StoredState,
  person: { name: string; relationship: string; portraitId?: string },
): StoredState {
  const recipient: StoredRecipient = {
    id: newRecipientId(),
    name: person.name.trim(),
    relationship: person.relationship.trim(),
    portraitId: person.portraitId,
  };
  return {
    ...state,
    seenOnboarding: true,
    activeRecipientId: recipient.id,
    recipients: [...state.recipients, recipient],
  };
}

/** Records who is holding the phone, so the app speaks from them. */
export function withOrganiserName(state: StoredState, name: string): StoredState {
  return { ...state, organiserName: name.trim() };
}

/**
 * A recipient's moments, each carrying its persisted status (default: open).
 *
 * `null` is a real input, not a guard: before setup is finished the plan
 * belongs to nobody, and "the moments of nobody" is an empty list rather than
 * an error. Every derivation in `App` runs during setup, so each one has to
 * survive being asked about a plan that does not exist yet.
 */
export function tasksForRecipient(state: StoredState, recipientId: string | null): CareTask[] {
  if (!recipientId) return [];
  return (state.moments[recipientId] ?? []).map((moment) => ({
    ...moment,
    status: state.statuses[recipientId]?.[moment.id] ?? ("not-confirmed" as TaskStatus),
  }));
}

/* --- moments --------------------------------------------------------------- */

export function newMomentId(): string {
  return `moment-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function withMoment(
  state: StoredState,
  recipientId: string,
  moment: TaskTemplate,
): StoredState {
  const existing = state.moments[recipientId] ?? [];
  return {
    ...state,
    seenOnboarding: true,
    activeRecipientId: recipientId,
    moments: {
      ...state.moments,
      [recipientId]: [...existing.filter((item) => item.id !== moment.id), moment],
    },
  };
}

/**
 * "Start from a template" — the four everyday moments, added to a plan.
 *
 * They keep their template ids, which is what makes the action safe to press
 * twice and what lets a status the user already set survive a second press.
 * Statuses are not written: a moment with no stored status is open, so the plan
 * arrives at 0 of 4 rather than at somebody's idea of a finished day.
 */
export function withStarterMoments(state: StoredState, recipientId: string): StoredState {
  const existing = state.moments[recipientId] ?? [];
  const have = new Set(existing.map((moment) => moment.id));
  const added = STARTER_MOMENTS.filter((moment) => !have.has(moment.id));
  if (added.length === 0) return state;
  return {
    ...state,
    seenOnboarding: true,
    activeRecipientId: recipientId,
    moments: { ...state.moments, [recipientId]: [...existing, ...added] },
  };
}

/** Puts every moment for one recipient back to "not confirmed". Keeps moments. */
export function withResetDay(state: StoredState, recipientId: string): StoredState {
  const forRecipient = { ...(state.statuses[recipientId] ?? {}) };
  for (const taskId of Object.keys(forRecipient)) {
    forRecipient[taskId] = "not-confirmed";
  }
  return {
    ...state,
    seenOnboarding: true,
    activeRecipientId: recipientId,
    statuses: { ...state.statuses, [recipientId]: forRecipient },
  };
}

/* --- state transitions (pure, testable) ------------------------------------ */

export function withTaskStatus(
  state: StoredState,
  recipientId: string,
  taskId: string,
  status: TaskStatus,
): StoredState {
  const forRecipient = { ...(state.statuses[recipientId] ?? {}), [taskId]: status };
  return {
    ...state,
    seenOnboarding: true,
    activeRecipientId: recipientId,
    statuses: { ...state.statuses, [recipientId]: forRecipient },
  };
}

export function withActiveRecipient(state: StoredState, recipientId: string): StoredState {
  return { ...state, seenOnboarding: true, activeRecipientId: recipientId };
}

/* --- notes ----------------------------------------------------------------- */

/** Local date key. `toISOString` would shift the day for anyone east of UTC. */
export function todayKey(now: Date = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function withAddedNote(
  state: StoredState,
  recipientId: string,
  text: string,
): StoredState {
  const note: StoredNote = {
    id: `note-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    recipientId,
    text,
    day: todayKey(),
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    seenOnboarding: true,
    activeRecipientId: recipientId,
    notes: [note, ...state.notes],
  };
}

/** Newest first. Empty when there is nobody to keep notes for yet. */
export function notesForRecipient(state: StoredState, recipientId: string | null): StoredNote[] {
  if (!recipientId) return [];
  return state.notes.filter((note) => note.recipientId === recipientId);
}

export function notesLeftToday(state: StoredState, recipientId: string): number {
  const today = todayKey();
  const used = state.notes.filter(
    (note) => note.recipientId === recipientId && note.day === today,
  ).length;
  return Math.max(0, FREE_NOTES_PER_DAY - used);
}
