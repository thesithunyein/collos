import {
  CareRecipient,
  CareTask,
  TaskStatus,
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
 */

const STORE_KEY = "collos.care.v1";
const FILE_NAME = "care-state.json";

export type StoredTask = {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: CareTask["icon"];
  tone: CareTask["tone"];
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
  version: 1;
  /** Per recipient, per task: the last status the user chose for it. */
  statuses: Record<string, Record<string, TaskStatus>>;
  /** Moments the user added themselves, kept separately from the built-ins. */
  customTasks: Record<string, StoredTask[]>;
  /** Notes left for whoever picks up the plan next. Newest first. */
  notes: StoredNote[];
  /** The recipient last viewed, so a restart reopens the same plan. */
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
    version: 1,
    statuses: {},
    customTasks: {},
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
    if (parsed.version !== 1 || typeof parsed !== "object") return null;
    return {
      version: 1,
      statuses: parsed.statuses ?? {},
      customTasks: parsed.customTasks ?? {},
      // Notes arrived after v1 shipped, so an older payload must still load.
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
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

export function withCustomMoment(
  state: StoredState,
  recipientId: string,
  task: StoredTask,
): StoredState {
  const existing = state.customTasks[recipientId] ?? [];
  return {
    ...state,
    seenOnboarding: true,
    activeRecipientId: recipientId,
    customTasks: {
      ...state.customTasks,
      [recipientId]: [...existing.filter((item) => item.id !== task.id), task],
    },
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

/**
 * The tasks a recipient's plan actually shows: the built-in moments plus the
 * ones the user added, each carrying its persisted status (default: open).
 */
export function tasksForRecipient(state: StoredState, recipient: CareRecipient): CareTask[] {
  const custom = (state.customTasks[recipient.id] ?? []).map((item) => ({
    ...item,
    status: state.statuses[recipient.id]?.[item.id] ?? ("not-confirmed" as TaskStatus),
  }));
  const builtIn = recipient.tasks.map((task) => ({
    ...task,
    status: state.statuses[recipient.id]?.[task.id] ?? task.status,
  }));
  return [...builtIn, ...custom];
}

export function newMomentId(): string {
  return `moment-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
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

/** Newest first. */
export function notesForRecipient(state: StoredState, recipientId: string): StoredNote[] {
  return state.notes.filter((note) => note.recipientId === recipientId);
}

export function notesLeftToday(state: StoredState, recipientId: string): number {
  const today = todayKey();
  const used = state.notes.filter(
    (note) => note.recipientId === recipientId && note.day === today,
  ).length;
  return Math.max(0, FREE_NOTES_PER_DAY - used);
}
