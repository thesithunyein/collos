import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { CareTask, TaskStatus } from "../data/care";
import { REPEAT_LABELS } from "../data/care";
import { useReduceMotion } from "../platform/motion";
import { colors, elevation, motion, nativeAnimDriver, numeric, shape, space, type } from "../theme";

// Tone keys are stored with each saved moment, so they keep their old names even
// though the colours behind them now come from the logo's palette.
const TONES = {
  blue: { background: colors.blueWash, icon: colors.blue },
  orange: { background: colors.blushWash, icon: colors.blush },
  green: { background: colors.mintWash, icon: colors.mint },
  purple: { background: colors.lilacWash, icon: colors.lilac },
} as const;

/**
 * Both controls on a row are drawn 36px tall, which is short of Apple's 44pt
 * and Material's 48dp minimum for a touch target. The chrome itself stays that
 * size — taking chrome off this list was the point of the last pass — and the
 * *touching* area grows around it instead. A control nobody can hit reliably is
 * not a smaller button, it is a broken one.
 *
 * Two shapes, because the two controls are 9px apart: padding both of them out
 * sideways by 6 would overlap by 3px and hand a strip of taps to the wrong one,
 * which on this row means skipping instead of confirming. Confirm is already
 * wide, so it only needs height; Skip is a 36px circle, so it needs both.
 */
const TOUCH_SLOP_ROW = { top: 6, bottom: 6 };
const TOUCH_SLOP_ICON = { top: 6, bottom: 6, left: 6, right: 6 };

/**
 * One moment on today's plan.
 *
 * The card physically answers every tap: a quick press shrinks it a few percent
 * and a spring returns it on release, so a confirm reads as an action rather
 * than a repaint. The three states are shaped so they can be told apart at a
 * glance without reading — confirmed gets the filled button and a quieted title,
 * skipped gets an outlined pill with a strike through the word, and everything
 * else stays inviting.
 *
 * A skip is not a dead end: the moment keeps its place and grows a one-tap way
 * to move it to tomorrow, because "not now, later" is what a carer actually
 * means and the two used to be indistinguishable.
 */
export function TaskCard({
  task,
  arrived = false,
  onUpdate,
  onOpenEditor,
  onMoveToTomorrow,
}: {
  task: CareTask;
  /**
   * The moment was moved to today and today is now the day it was moved to:
   * the arrival half of the skip loop. Display-only; the source of truth is
   * the deferred map in the store.
   */
  arrived?: boolean;
  onUpdate: (id: string, status: TaskStatus) => void;
  /** Opens the sheet that renames, reschedules or deletes this moment. */
  onOpenEditor: (task: CareTask) => void;
  /** Pushes the moment onto tomorrow's plan. */
  onMoveToTomorrow: (id: string) => void;
}) {
  const isConfirmed = task.status === "confirmed";
  const isSkipped = task.status === "skipped";
  const tone = TONES[task.tone];
  const reduceMotion = useReduceMotion();

  const press = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  // The spring fires only when the press actually ends, so a user who slides
  // off the button cancels cleanly instead of getting a ghost bounce.
  useEffect(() => {
    if (pressed) return;
    // With reduce motion on, the row returns instantly rather than springing.
    // The press still registers — it just stops moving.
    if (reduceMotion) {
      press.setValue(1);
      return;
    }
    Animated.spring(press, {
      toValue: 1,
      ...motion.spring.press,
      useNativeDriver: nativeAnimDriver,
    }).start();
  }, [pressed, press, reduceMotion]);

  const repeatLabel =
    task.repeat && task.repeat !== "daily" ? REPEAT_LABELS[task.repeat].short : null;
  const hasMeta = Boolean(repeatLabel) || isSkipped || arrived;

  return (
    <Animated.View
      style={[
        styles.taskCard,
        isConfirmed && styles.taskCardConfirmed,
        isSkipped && styles.taskCardSkipped,
        { transform: [{ scale: press }] },
      ]}
    >
      <View style={[styles.taskIcon, { backgroundColor: tone.background }]}>
        <Ionicons name={task.icon} size={20} color={tone.icon} />
        {/* State rides on the leading tile, the way Luma tags a row's state on
            its thumbnail: a glance down the column tells you what is done
            without reading a single word of copy. */}
        {isConfirmed || isSkipped ? (
          <View style={[styles.statusBadge, isSkipped && styles.statusBadgeSkipped]}>
            <Ionicons
              name={isConfirmed ? "checkmark" : "arrow-forward"}
              size={9}
              color={colors.white}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.taskCopy}>
        <View style={styles.taskTitleRow}>
          <Text
            style={[styles.taskTitle, (isConfirmed || isSkipped) && styles.taskTitleDone]}
          >
            {task.title}
          </Text>
          <View style={styles.taskTimeRow}>
            <Ionicons name="time-outline" size={12} color={colors.muted} />
            <Text style={styles.taskTime}>{task.time}</Text>
          </View>
          {/* The way in to changing a moment. It sits with the title rather than
              in the action row because it is not a state — Confirm and Skip
              answer "did this happen", and this answers "is this right". */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${task.title}`}
            hitSlop={TOUCH_SLOP_ICON}
            onPress={() => onOpenEditor(task)}
            style={({ pressed: isPressed }) => [
              styles.menuButton,
              isPressed && styles.pressed,
            ]}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Text style={styles.taskDetail}>{task.detail}</Text>

        {hasMeta ? (
          <View style={styles.metaRow}>
            {/* Arrival: the visible payoff of a move. A moment moved to today
                wears proof of where it came from, so the loop the app promises
                — skip, not lose — finishes where it started: on the plan. */}
            {arrived ? (
              <View style={styles.arrivedChip}>
                <Ionicons name="arrow-undo" size={11} color={colors.blue} />
                <Text style={styles.metaChipText}>Moved here</Text>
              </View>
            ) : null}
            {repeatLabel ? (
              <View style={styles.metaChip}>
                <Ionicons name="repeat-outline" size={11} color={colors.blue} />
                <Text style={styles.metaChipText}>{repeatLabel}</Text>
              </View>
            ) : null}
            {/* Reschedule on skip. A skipped moment used to just go quiet, so
                "I couldn't do it" and "that is not happening" looked the same.
                One tap moves it, and the moment survives the day. */}
            {isSkipped ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Move ${task.title} to tomorrow`}
                onPress={() => onMoveToTomorrow(task.id)}
                style={({ pressed: isPressed }) => [
                  styles.moveButton,
                  isPressed && styles.pressed,
                ]}
              >
                <Ionicons name="arrow-forward" size={11} color={colors.blue} />
                <Text style={styles.moveButtonText}>Move to tomorrow</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.taskActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ checked: isConfirmed }}
            accessibilityLabel={`${isConfirmed ? "Unconfirm" : "Confirm"} ${task.title}`}
            hitSlop={TOUCH_SLOP_ROW}
            onPressIn={() => {
              setPressed(true);
              if (!reduceMotion) press.setValue(0.975);
            }}
            onPressOut={() => setPressed(false)}
            onPress={() => onUpdate(task.id, isConfirmed ? "not-confirmed" : "confirmed")}
            style={({ pressed: isPressed }) => [
              styles.confirmButton,
              isConfirmed && styles.confirmedButton,
              isPressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={isConfirmed ? "checkmark" : "checkmark-outline"}
              size={14}
              color={isConfirmed ? colors.white : colors.blue}
            />
            <Text style={[styles.confirmButtonText, isConfirmed && styles.confirmedButtonText]}>
              {isConfirmed ? "Confirmed" : "Confirm"}
            </Text>
          </Pressable>
          {/*
           * Skip is an icon, not a second button.
           *
           * Two bordered buttons side by side turned every row into a control
           * panel: with eight of them down the screen the eye read "two
           * choices" instead of "this moment, and the option to pass". The
           * action is unchanged, and a screen reader still gets "Skip Morning
           * check-in" — it is the chrome around it that went away.
           */}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSkipped }}
            accessibilityLabel={`${isSkipped ? "Unskip" : "Skip"} ${task.title}`}
            hitSlop={TOUCH_SLOP_ICON}
            onPress={() => onUpdate(task.id, isSkipped ? "not-confirmed" : "skipped")}
            style={({ pressed: isPressed }) => [
              styles.skipButton,
              isSkipped && styles.skipButtonOn,
              isPressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={isSkipped ? "arrow-undo" : "arrow-forward"}
              size={17}
              color={isSkipped ? colors.blush : colors.muted}
            />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: shape.lg,
    padding: space.xl,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  taskCardConfirmed: { borderColor: colors.borderSoft, backgroundColor: colors.soft },
  taskCardSkipped: { borderColor: colors.border, backgroundColor: colors.soft },
  /**
   * Round, not a rounded square.
   *
   * The icon well is the app's version of the same shape the landing site uses
   * for a card's icon, and it is the shape a person is drawn in too — so the
   * leading tile and every face in the header now share one form.
   */
  taskIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.lg,
  },
  /** A small mark on the tile: confirmed reads blue, skipped reads blush. */
  statusBadge: {
    position: "absolute",
    right: -5,
    bottom: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    // Rings the badge in the settled card's own fill so it reads as punched
    // out of the tile rather than pasted on top of it.
    borderWidth: 2,
    borderColor: colors.soft,
  },
  statusBadgeSkipped: { backgroundColor: colors.blush },
  taskCopy: { flex: 1 },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  taskTitle: { ...type.subhead, color: colors.ink, flex: 1 },
  taskTitleDone: { color: colors.muted, textDecorationLine: "line-through" },
  taskTimeRow: { flexDirection: "row", alignItems: "center", gap: space.xxs },
  /** Tabular: the time sits above a row whose state changes, and proportional
   *  digits would let the label shuffle as the plan updates around it. */
  taskTime: { ...type.micro, color: colors.muted, fontWeight: "700", ...numeric },
  menuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: space.xxs,
  },
  taskDetail: { ...type.caption, color: colors.muted, marginTop: space.xxs },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.sm,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
    backgroundColor: colors.blueWash,
    borderRadius: 9,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  /** The arrival chip: the same family as the repeat chip, one icon changed. */
  arrivedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
    backgroundColor: colors.blueWash,
    borderRadius: 9,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  metaChipText: { ...type.tag, color: colors.blue, letterSpacing: 0.2 },
  moveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
    minHeight: 28,
    paddingHorizontal: space.sm,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  moveButtonText: { ...type.tag, color: colors.blue, letterSpacing: 0 },
  taskActions: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: space.lg },
  confirmButton: {
    minHeight: 36,
    paddingHorizontal: space.lg,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.blueWash,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
  },
  confirmedButton: { backgroundColor: colors.blue, borderColor: colors.blue },
  confirmButtonText: { ...type.caption, color: colors.blue },
  confirmedButtonText: { color: colors.white },
  skipButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    // Pinned to the card's trailing edge rather than trailing the button: with
    // "Confirm" and "Confirmed" being different widths, hanging the icon off the
    // button put it at a different x on every row, which read as drift.
    marginLeft: "auto",
  },
  /** A skip keeps a wash, so the row still reads as settled without a label. */
  skipButtonOn: { backgroundColor: colors.blushWash },
  pressed: { opacity: 0.72 },
});
