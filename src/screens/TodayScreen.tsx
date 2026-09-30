import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Avatar } from "../components/Avatar";
import { TaskCard } from "../components/TaskCard";
import type { CareRecipient, CareTask, TaskStatus } from "../data/care";

import { colors, elevation, insets, motion, numeric, shape, space, type } from "../theme";

/**
 * The hero's progress number eases from its previous value to each new one, so
 * confirming a moment and watching the plan respond reads as motion rather
 * than a repaint.
 *
 * Two details matter. It starts *at* the current value and never at zero: the
 * number is read from a JS listener, and a tween that began at 0 showed `0%`
 * next to "1 of 4 confirmed" for anyone who looked before the animation ran
 * (a throttled background tab never runs it at all). And it deliberately uses
 * the JS driver rather than the native one, because a native-driven value is
 * not readable from JS — the label would sit at its initial value forever.
 * The ring itself is unchanged; only this label is animated.
 */
function useCountUp(target: number, duration = motion.duration.hero): Animated.Value {
  const value = useRef(new Animated.Value(target)).current;
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    const listenerId = value.addListener(({ value: shown }) => {
      current.current = shown;
    });
    Animated.timing(value, {
      toValue: target,
      duration: Math.min(duration, 260 + Math.abs(target - from) * 3),
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    return () => value.removeListener(listenerId);
  }, [target, duration, value]);

  return value;
}

/**
 * How many arcs the ring is divided into.
 *
 * Four is not arbitrary: the authored plan is four moments, and each moment is
 * a quarter of the day, so one lit arc means exactly one confirmed moment and
 * the ring agrees with the "1 of 4 confirmed" line underneath it. Luma's
 * equivalent is a clean piece of state rather than ornament, and a ring that
 * cannot be trusted is worse than no ring.
 *
 * The count is fixed rather than following the moment count, because a single
 * coloured border is a 90° arc: five arcs at 72° spacing would overlap, and
 * two or three arcs at their natural spacing would leave visible gaps in a
 * ring that is supposed to read as continuous. The cost is quantisation — a
 * plan with five moments shows 20% beside one lit quarter. The exact figure is
 * the number; the arcs are the glanceable shape, and a stepped gauge that
 * always looks intact beats an exact one that looks broken at two moments.
 */
const RING_SEGMENTS = 4;

/**
 * A pool of soft light, drawn as concentric discs of a low, equal alpha.
 *
 * A radial gradient would be a single node; RN has none without
 * `react-native-svg`, and adding an unpinned native module this late is the
 * risk the `expo-font` incident already warned about. So the falloff is
 * stepped: discs sharing one centre accumulate linearly toward the middle,
 * which is exactly the ramp a glow wants. *Eight* steps and not three, because
 * three left the disc edges visible as arcs behind the hero card — at ~4%
 * alpha each, the steps read as light instead of as rings. The launch screen
 * and the onboarding halo use the same trick, so the lighting language is
 * identical everywhere in the app.
 */
const GLOW_STEPS = 8;
const GLOW_ALPHA = 0.042;

function Glow({
  color,
  size,
  style,
}: {
  /** `"r,g,b"`, so the alpha can be layered per disc. */
  color: string;
  size: number;
  /** Position only — `Glow` owns the box it fills. */
  style: ViewStyle;
}) {
  return (
    <View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, style]}>
      {Array.from({ length: GLOW_STEPS }, (_, index) => {
        const disc = size * ((index + 1) / GLOW_STEPS);
        const inset = (size - disc) / 2;
        return (
          <View
            key={index}
            style={{
              position: "absolute",
              top: inset,
              left: inset,
              width: disc,
              height: disc,
              borderRadius: disc / 2,
              backgroundColor: `rgba(${color},${GLOW_ALPHA})`,
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Four separate 90° arcs, lit from the top clockwise.
 *
 * The previous version laid one translucent disc over the whole track, so 25%
 * and 100% rendered identically — the number was the only thing carrying the
 * value. A real arc needs SVG or a mask, neither of which this project has, but
 * a single coloured border on a circle *is* a 90° arc, so four rotated copies
 * tile the ring exactly with no geometry to get wrong.
 */
function ProgressRing({ progress }: { progress: number }) {
  const animated = useCountUp(progress);
  const [shown, setShown] = useState(progress);

  useEffect(() => {
    const id = animated.addListener(({ value }) => setShown(value));
    return () => animated.removeListener(id);
  }, [animated]);

  const lit = Math.round((shown / 100) * RING_SEGMENTS);

  return (
    <View style={styles.progressRing} accessibilityLabel={`${Math.round(shown)}% of today's plan done`}>
      {Array.from({ length: RING_SEGMENTS }, (_, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[
            styles.progressSegment,
            { transform: [{ rotate: `${index * (360 / RING_SEGMENTS)}deg` }] },
            { borderTopColor: index < lit ? colors.white : "rgba(255,255,255,0.30)" },
          ]}
        />
      ))}
      <Text style={styles.progressValue}>{Math.round(shown)}%</Text>
      <Text style={styles.progressLabel}>done</Text>
    </View>
  );
}

export type TodayScreenProps = {
  recipients: CareRecipient[];
  recipient: CareRecipient;
  tasks: CareTask[];
  completedCount: number;
  progress: number;
  isLoading: boolean;
  pro: boolean;
  /** Notes kept for this recipient on this device. */
  noteCount: number;
  /** The person holding the phone, from stored state — empty when unsaid. */
  organiserName: string;
  /**
   * Moments moved off today's plan: moment id → the day it went to, already
   * phrased ("tomorrow"). Read-only display state; the map is derived in App.
   */
  movedMoments: Record<string, string>;
  /** Moment ids whose moved-to day is today — the arrival half of the loop. */
  arrivedMoments: Set<string>;
  onSelectRecipient: (recipient: CareRecipient) => void;
  onUpdateTask: (taskId: string, status: TaskStatus) => void;
  /** Opens the sheet that renames, reschedules or deletes a moment. */
  onOpenTaskEditor: (task: CareTask) => void;
  /** Pushes a moment onto tomorrow's plan — the other half of skipping it. */
  onMoveTaskToTomorrow: (taskId: string) => void;
  onAddMoment: () => void;
  /** Puts the four everyday moments on this person's plan, all open. */
  onUseStarterPlan: () => void;
  onOpenPaywall: () => void;
  onOpenNotes: () => void;
  /** The avatar is the way into your account and settings. */
  onOpenAccount: () => void;
};

export function TodayScreen({
  recipients,
  recipient,
  tasks,
  completedCount,
  progress,
  isLoading,
  pro,
  noteCount,
  organiserName,
  movedMoments,
  arrivedMoments,
  onSelectRecipient,
  onUpdateTask,
  onOpenTaskEditor,
  onMoveTaskToTomorrow,
  onAddMoment,
  onUseStarterPlan,
  onOpenPaywall,
  onOpenNotes,
  onOpenAccount,
}: TodayScreenProps) {
  /**
   * The moved-moments line. `movedMoments` maps id → phrased day, so the count
   * is the map's size and the phrase reused is simply its first value.
   */
  const movedEntries = Object.values(movedMoments);
  const movedCount = movedEntries.length;
  const nextMovedDay = movedEntries[0];

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{dateLine()}</Text>
            <Text style={styles.greeting}>{organiserGreeting(organiserName)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your account and settings"
            onPress={onOpenAccount}
            style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
          >
            <Avatar initials={organiserInitials(organiserName)} size={44} />
            {pro ? (
              <View style={styles.proDot}>
                <Ionicons name="sparkles" size={9} color={colors.white} />
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.recipientSwitcher}>
          <Text style={styles.sectionLabel}>Caring for</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipientRow}
          >
            {recipients.map((item) => {
              const isSelected = item.id === recipient.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Care for ${item.name}, ${item.relationship}`}
                  onPress={() => onSelectRecipient(item)}
                  style={({ pressed }) => [
                    styles.recipientChip,
                    isSelected && styles.recipientChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Avatar
                    source={item.portrait}
                    initials={item.initials}
                    size={34}
                    onBrand={isSelected}
                  />
                  <View>
                    <Text style={[styles.chipName, isSelected && styles.chipNameSelected]}>{item.name}</Text>
                    <Text style={[styles.chipRelationship, isSelected && styles.chipRelationshipSelected]}>
                      {item.relationship}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={styles.skeletonStack} accessibilityLabel="Loading care plan">
            <View style={[styles.skeleton, styles.skeletonHero]} />
            <View style={styles.skeleton} />
            <View style={styles.skeleton} />
          </View>
        ) : (
          <>
            <View style={styles.heroGlowWrap}>
              <Glow color="154,191,243" size={210} style={styles.heroGlowLarge} />
              <Glow color="96,177,255" size={170} style={styles.heroGlowSmall} />
              <View style={styles.heroCard}>
                <View style={styles.heroContent}>
                  <Text style={styles.heroKicker}>Today’s care plan</Text>
                  <Text style={styles.heroTitle}>A little goes a long way.</Text>
                  <Text style={styles.heroText}>
                    You’re helping {recipient.name} feel remembered and supported.
                  </Text>
                </View>
                <ProgressRing progress={progress} />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Today’s moments</Text>
                <Text style={styles.sectionMeta}>
                  {/* "0 of 0 confirmed" is a fraction nobody can improve, and it
                      is the first thing a new plan would say. */}
                  {tasks.length === 0
                    ? "Nothing planned yet"
                    : `${completedCount} of ${tasks.length} confirmed`}
                </Text>
                {movedCount > 0 ? (
                  <Text style={styles.movedNote}>
                    {movedCount === 1
                      ? `1 moment moved to ${Object.values(movedMoments)[0]}.`
                      : `${movedCount} moments moved — the next one to ${nextMovedDay}.`}
                  </Text>
                ) : null}
              </View>
              <View style={styles.sectionActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a moment to today's plan"
                  onPress={onAddMoment}
                  style={({ pressed }) => [styles.pillButton, pressed && styles.pillButtonPressed]}
                >
                  <Ionicons name="add" size={16} color={colors.blue} />
                  <Text style={styles.pillButtonText}>Add</Text>
                </Pressable>
                {/* "Reset day" used to sit here, as a peer of Add.

                    It cleared every confirmation, which is a *device* action,
                    not a plan action, and it sat beside the one button a
                    person actually presses on this screen — a destructive-adjacent
                    control one slip away from the useful one. It lives in
                    Settings now, next to the other state controls. */}
              </View>
            </View>

            {tasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={28} color={colors.blue} />
                <Text style={styles.emptyTitle}>No moments planned yet</Text>
                <Text style={styles.emptyText}>
                  Add a small check-in so your care circle knows what matters today.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a moment"
                  onPress={onAddMoment}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Add a moment</Text>
                </Pressable>
                {/* The way out of an empty plan that costs one tap instead of
                    four. It lives here rather than somewhere in Settings
                    because this is the only screen where the blank page is
                    actually in front of someone. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Start from a template"
                  onPress={onUseStarterPlan}
                  style={({ pressed }) => [styles.templateButton, pressed && styles.pressed]}
                >
                  <Ionicons name="layers-outline" size={15} color={colors.blue} />
                  <Text style={styles.templateButtonText}>Start from a template</Text>
                </Pressable>
                <Text style={styles.emptyHint}>
                  Adds four everyday moments — a morning check-in, a water break, fresh air and an
                  evening note. All open, so you only tick what you actually did, and each one can
                  be set to weekdays or weekends once it is on the plan.
                </Text>
              </View>
            ) : (
              <View style={styles.taskList}>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    arrived={arrivedMoments.has(task.id)}
                    onUpdate={onUpdateTask}
                    onOpenEditor={onOpenTaskEditor}
                    onMoveToTomorrow={onMoveTaskToTomorrow}
                  />
                ))}
              </View>
            )}

            <SharedNotesStrip
              pro={pro}
              noteCount={noteCount}
              recipientName={recipient.name}
              onOpen={onOpenNotes}
            />

            {/* The notes row and the Pro row were two cards 18px apart, so they
                read as one block: a person scanning past them saw a single
                monetisation stack rather than "what was written" and then
                "the paid tier". The dashed rule is the same device the site
                uses to divide chrome, and it says the two belong to different
                thoughts. */}
            <View style={styles.planDivider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Collos Pro"
              onPress={onOpenPaywall}
              style={({ pressed }) => [styles.proCard, pressed && styles.pressed]}
            >
              <View style={styles.proIcon}>
                <Ionicons name="sparkles" size={18} color={colors.white} />
              </View>
              <View style={styles.proCopy}>
                <View style={styles.proTitleRow}>
                  <Text style={styles.proTitle}>
                    {pro ? "Collos Pro is active" : "Make care feel lighter"}
                  </Text>
                  <Text style={styles.proBadge}>PRO</Text>
                </View>
                <Text style={styles.proText}>
                  {pro
                    ? "Unlimited shared notes are unlocked."
                    : "One shared note a day. Pro keeps as many as you like."}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.blue} />
            </Pressable>

          </>
        )}
      </ScrollView>
    </View>
  );
}

/** A real date line — the plan is about *today*, so the header must say today. */
function dateLine(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Time-aware greeting, built from the stored organiser's name.
 *
 * With a name it reads "Good morning, Ama"; without one — an existing install
 * whose payload predates the field, or someone who never said — it falls back to
 * who the plan is *for*, so the line never invents a person.
 */
function organiserGreeting(organiserName: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return organiserName ? `${part}, ${organiserName}` : `${part} 👋`;
}

/** The organiser's initials for the header avatar, same rule the store uses. */
function organiserInitials(organiserName: string): string {
  const words = organiserName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "You";
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * The way into shared notes — the feature the entitlement actually sells. Both
 * tiers open the same sheet; the free plan is limited inside it, so nobody hits
 * a wall before they have seen what the feature is.
 */
function SharedNotesStrip({
  pro,
  noteCount,
  recipientName,
  onOpen,
}: {
  pro: boolean;
  noteCount: number;
  recipientName: string;
  onOpen: () => void;
}) {
  const kept =
    noteCount === 0
      ? "No notes yet — leave the first one."
      : `${noteCount} note${noteCount === 1 ? "" : "s"} kept for ${recipientName} on this device.`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        pro ? `Open shared notes, ${noteCount} saved` : "Open shared notes, free plan"
      }
      onPress={onOpen}
      style={({ pressed }) => [styles.notesCard, pressed && styles.pressed]}
    >
      <View style={styles.notesIcon}>
        <Ionicons name="chatbubble-ellipses" size={17} color={colors.blue} />
        {noteCount > 0 ? <View style={styles.notesCountDot} /> : null}
      </View>
      <View style={styles.notesCopy}>
        <View style={styles.notesTitleRow}>
          <Text style={styles.notesTitle}>Shared notes</Text>
          {!pro ? <Text style={styles.notesLockBadge}>1 / DAY</Text> : null}
        </View>
        <Text style={styles.notesText}>
          {pro ? kept : noteCount === 0 ? "Leave the first note for whoever picks up the plan next." : `${noteCount} of today's notes kept — one a day on the free plan.`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.soft },
  scrollContent: { paddingHorizontal: space.xxxl, paddingBottom: 180 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: space.xxxl + insets.top,
    paddingBottom: space.huge,
  },
  eyebrow: { ...type.micro, color: colors.muted },
  greeting: { ...type.display, color: colors.ink, marginTop: space.xs },
  /** No fill or radius here: `Avatar` draws the portrait and the fallback. */
  avatarWrap: { width: 44, height: 44 },
  proDot: {
    position: "absolute",
    right: -space.xxs,
    bottom: -space.xxs,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.soft,
  },
  /**
   * Sits above the hero on purpose.
   *
   * The hero block comes later in the tree and carries both an absolutely
   * positioned glow that bleeds ~34px upward and a 24px shadow, so without this
   * the bottom half of every recipient chip got washed blue — the chips read as
   * half-selected, which is precisely the "something is subtly wrong" feeling
   * the polish pass is trying to remove. Sibling `zIndex` is the fix that keeps
   * the glow's upward spill, which is what makes the hero look lit.
   */
  recipientSwitcher: { marginBottom: space.xxxl, zIndex: 2 },
  heroGlowWrap: { position: "relative", zIndex: 0 },
  sectionLabel: { ...type.micro, color: colors.muted, marginBottom: space.md },
  recipientRow: { gap: space.md, paddingRight: space.xxs },
  recipientChip: {
    minWidth: 126,
    minHeight: 60,
    backgroundColor: colors.white,
    borderRadius: shape.md,
    padding: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  recipientChipSelected: { backgroundColor: colors.blue, borderColor: colors.blue, ...elevation.lifted },
  chipName: { ...type.subhead, color: colors.ink },
  chipNameSelected: { color: colors.white },
  chipRelationship: { ...type.micro, fontWeight: "400", color: colors.muted, marginTop: 2 },
  chipRelationshipSelected: { color: colors.blueTint },
  /** Anchors only: `Glow` draws the discs inside whatever box this describes. */
  heroGlowLarge: { top: -34, left: -30 },
  heroGlowSmall: { bottom: -40, right: -22 },
  heroCard: {
    backgroundColor: colors.blue,
    borderRadius: shape.xl,
    padding: space.xxxl,
    // Floats above the glow ellipses behind it.
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    overflow: "hidden",
    marginBottom: space.huge,
  },
  heroContent: { flex: 1, paddingRight: space.sm },
  heroKicker: { ...type.micro, color: colors.blueTint },
  /**
   * The one size in the app that is not on the scale.
   *
   * The hero card is a half-width column beside a 72pt ring, so a 21pt `title`
   * wraps it to three lines and the card grows taller than the ring it is
   * meant to sit beside. 19/24 is the largest size that keeps the headline on
   * two lines at 360pt wide, and it keeps its own leading and tracking for the
   * same reason every token does.
   */
  heroTitle: {
    color: colors.white,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: space.md,
    letterSpacing: -0.4,
  },
  heroText: { ...type.callout, color: colors.blueTint, marginTop: space.sm },
  progressRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    // The unlit track only. It used to be full periwinkle, which sat *under*
    // the arcs and made an unconfirmed quarter look half-lit anyway.
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  /**
   * One 90° arc: a circle that shows only its top border. `borderColor` has to
   * be transparent first or the remaining three borders would square the shape
   * off. Four of these, rotated 0/90/180/270, tile the ring exactly.
   */
  progressSegment: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 5,
    borderRadius: 36,
    borderColor: "transparent",
  },
  /** Tabular, because this is the one number in the app that animates: the
   *  count-up would otherwise make every digit to its left shift as it runs. */
  progressValue: { ...type.subhead, fontWeight: "700", color: colors.white, ...numeric },
  progressLabel: { ...type.tag, fontWeight: "600", letterSpacing: 0, color: colors.blueTint, marginTop: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.lg,
  },
  sectionTitle: { ...type.heading, color: colors.ink },
  sectionMeta: { ...type.caption, color: colors.muted, marginTop: space.xxs },
  /** The moved-moments line: proof the loop closed, in the plan's own voice. */
  movedNote: {
    ...type.caption,
    color: colors.blue,
    marginTop: 2,
  },
  sectionActions: { flexDirection: "row", alignItems: "center", gap: space.sm },
  pillButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
    paddingHorizontal: space.lg,
    borderRadius: 99,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  pillButtonPressed: { opacity: 0.6 },
  pillButtonText: { ...type.caption, fontWeight: "600", color: colors.blue },
  taskList: { gap: space.md },
  /**
   * Divides the plan's own rows from the Pro row.
   *
   * The two were cards 18px apart and read as one block, so a person scanning
   * past saw a single monetisation stack rather than "what was written" and
   * then "the paid tier". A dashed rule is the same divider the landing page
   * uses between chrome, and it costs one pixel instead of a section heading.
   */
  planDivider: {
    height: 1,
    marginTop: space.huge,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderTopColor: colors.borderSoft,
  },
  notesCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    backgroundColor: colors.white,
    borderRadius: shape.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    marginTop: space.xxxl,
    ...elevation.card,
  },
  notesIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  /** A quiet activity dot — notes exist on this device. */
  notesCountDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.mint,
    borderWidth: 2,
    borderColor: colors.white,
  },
  notesCopy: { flex: 1 },
  notesTitleRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  notesTitle: { ...type.subhead, color: colors.ink },
  notesLockBadge: { ...type.tag, color: colors.blue, letterSpacing: 0.5 },
  notesText: { ...type.caption, color: colors.muted, marginTop: space.xxs },
  proCard: {
    backgroundColor: colors.blueWash,
    borderRadius: shape.lg,
    padding: space.xl,
    marginTop: space.xxxl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
  },
  proIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  proCopy: { flex: 1 },
  proTitleRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  proTitle: { ...type.subhead, color: colors.ink },
  proBadge: { ...type.tag, color: colors.blue, letterSpacing: 0.5 },
  proText: { ...type.caption, color: colors.muted, marginTop: space.xxs },
  pressed: { opacity: 0.72 },
  skeletonStack: { gap: space.lg },
  skeleton: { height: 112, borderRadius: shape.xl, backgroundColor: colors.skeleton },
  skeletonHero: { height: 154 },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: shape.lg,
    alignItems: "center",
    padding: space.huge,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  emptyTitle: { ...type.heading, color: colors.ink, marginTop: space.md },
  emptyText: {
    ...type.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: space.xs,
  },
  secondaryButton: {
    minHeight: 44,
    backgroundColor: colors.blueWash,
    borderRadius: shape.sm,
    justifyContent: "center",
    paddingHorizontal: space.xxl,
    marginTop: space.xxl,
  },
  secondaryButtonText: { ...type.caption, fontWeight: "600", color: colors.blue },
  templateButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.md,
    marginTop: space.xs,
  },
  templateButtonText: { ...type.callout, fontWeight: "600", color: colors.blue },
  emptyHint: {
    ...type.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: 2,
    maxWidth: 280,
  },
});
