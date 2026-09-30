import type { ImageSourcePropType } from "react-native";

export type TaskStatus = "confirmed" | "not-confirmed" | "skipped";

/**
 * How often a moment comes back.
 *
 * `daily` is the default and the pre-existing behaviour — a moment used to
 * reappear every day with no way to say otherwise, and the add sheet said so in
 * those words. Real care is only *mostly* daily: the bins go out on Tuesdays,
 * the district nurse comes on weekdays, the family call is at the weekend. So
 * the rule is stored rather than assumed, and a moment that does not apply
 * today simply is not on today's plan.
 */
export type RepeatRule = "daily" | "weekdays" | "weekends";

/** The rules a person can pick, in the order they are offered. */
export const REPEAT_RULES: RepeatRule[] = ["daily", "weekdays", "weekends"];

/** What a rule is called in the UI, and what it means in one line. */
export const REPEAT_LABELS: Record<RepeatRule, { label: string; short: string }> = {
  daily: { label: "Every day", short: "Daily" },
  weekdays: { label: "Weekdays", short: "Mon–Fri" },
  weekends: { label: "Weekends", short: "Sat–Sun" },
};

/**
 * Days are read from a *local* calendar date, not from UTC.
 *
 * `Date.getDay()` is already local, which is the whole reason this takes a
 * `Date` rather than an ISO string: `toISOString` would move the day for anyone
 * east of UTC, so a weekday rule would drop out a day early for half the world.
 */
export function repeatMatchesOn(rule: RepeatRule | undefined, date: Date): boolean {
  if (!rule || rule === "daily") return true;
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  return rule === "weekends" ? isWeekend : !isWeekend;
}

/**
 * A moment as the app describes it, with no status attached.
 *
 * Status used to live on the template, which is how a new install could open on
 * "1 of 4 confirmed": the built-in plan shipped pre-ticked, so the first screen
 * after "Set up my care circle" claimed the user had already done something they
 * had never seen. A status is a fact about a day, not about the description of a
 * moment, so it lives in the store keyed by id (`storage/careStore.ts`).
 */
export type TaskTemplate = {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: "sunny-outline" | "water-outline" | "walk-outline" | "chatbubble-ellipses-outline";
  tone: "blue" | "orange" | "green" | "purple";
  /**
   * Absent means `daily`. Optional on purpose: every moment stored before this
   * field existed keeps working, and a payload written by an older build still
   * reads as the daily plan it was.
   */
  repeat?: RepeatRule;
};

/** A moment as a screen renders it: the stored moment plus its status today. */
export type CareTask = TaskTemplate & { status: TaskStatus };

/**
 * Someone the user cares for.
 *
 * Recipients are not built in. They are created by the user during onboarding
 * and live in stored state — this type is only the shape a screen renders, so
 * the UI never has to know where a person came from.
 */
export type CareRecipient = {
  id: string;
  name: string;
  relationship: string;
  /** Shown when there is no portrait — see `components/Avatar.tsx`. */
  initials: string;
  portrait?: ImageSourcePropType;
};

/**
 * Portraits a user can pick for someone they care for.
 *
 * Offered during setup rather than assigned, because the alternative for a
 * person the app has never met is initials — and a screen of letters is exactly
 * what this app used to look like before it had faces. Picking is optional; the
 * initials fallback is a designed state, not a placeholder.
 *
 * Portraits are hand-drawn line art (Notionists by Zoish, CC0 1.0) rather than
 * photographs, which keeps them consistent with the hand-drawn cat in the logo
 * and avoids putting a real stranger's face on someone in a public repository.
 * Bundled as files rather than fetched, so the app has no runtime network
 * dependency and still works offline.
 */
export const PORTRAITS: { id: string; source: ImageSourcePropType }[] = [
  { id: "margaret", source: require("../../assets/avatars/margaret.png") },
  { id: "daniel", source: require("../../assets/avatars/daniel.png") },
  { id: "sithu", source: require("../../assets/avatars/sithu.png") },
];

/** Relationships offered as chips during setup. The field takes anything. */
export const RELATIONSHIPS = ["Mum", "Dad", "Partner", "Grandparent", "Friend"];

/**
 * The four moments behind "Start from a template".
 *
 * These are the moments this app shipped as sample data for its own screenshots.
 * They are still useful — a plan that is one tap from looking like a plan is
 * worth having — but as something the user *chooses*, so a plan that reads "0 of
 * 4" is always something they asked for.
 */
export const STARTER_MOMENTS: TaskTemplate[] = [
  {
    id: "morning-check-in",
    title: "Morning check-in",
    detail: "A quick hello to start the day",
    time: "8:00 AM",
    icon: "sunny-outline",
    tone: "blue",
  },
  {
    id: "water-break",
    title: "Water break",
    detail: "Ask if they have had a drink",
    time: "10:30 AM",
    icon: "water-outline",
    tone: "orange",
  },
  {
    id: "fresh-air",
    title: "Fresh air",
    detail: "A gentle walk or time by the window",
    time: "2:00 PM",
    icon: "walk-outline",
    tone: "green",
  },
  {
    id: "evening-note",
    title: "Evening note",
    detail: "Share one good thing from today",
    time: "7:00 PM",
    icon: "chatbubble-ellipses-outline",
    tone: "purple",
  },
];
