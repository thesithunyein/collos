import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { CareTask, TaskStatus } from "../data/mockCare";
import { colors, elevation, nativeAnimDriver, shape } from "../theme";

// Tone keys are stored with each saved moment, so they keep their old names even
// though the colours behind them now come from the logo's palette.
const TONES = {
  blue: { background: colors.blueWash, icon: colors.blue },
  orange: { background: colors.blushWash, icon: colors.blush },
  green: { background: colors.mintWash, icon: colors.mint },
  purple: { background: colors.lilacWash, icon: colors.lilac },
} as const;

/**
 * One moment on today's plan.
 *
 * The card physically answers every tap: a quick press shrinks it a few percent
 * and a spring returns it on release, so a confirm reads as an action rather
 * than a repaint. The three states are shaped so they can be told apart at a
 * glance without reading — confirmed gets the filled button and a quieted title,
 * skipped gets an outlined pill with a strike through the word, and everything
 * else stays inviting.
 */
export function TaskCard({
  task,
  onUpdate,
}: {
  task: CareTask;
  onUpdate: (id: string, status: TaskStatus) => void;
}) {
  const isConfirmed = task.status === "confirmed";
  const isSkipped = task.status === "skipped";
  const tone = TONES[task.tone];

  const press = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  // The spring fires only when the press actually ends, so a user who slides
  // off the button cancels cleanly instead of getting a ghost bounce.
  useEffect(() => {
    if (!pressed) {
      Animated.spring(press, {
        toValue: 1,
        friction: 5,
        tension: 220,
        useNativeDriver: nativeAnimDriver,
      }).start();
    }
  }, [pressed, press]);

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
            style={[
              styles.taskTitle,
              (isConfirmed || isSkipped) && styles.taskTitleDone,
            ]}
          >
            {task.title}
          </Text>
          <View style={styles.taskTimeRow}>
            <Ionicons name="time-outline" size={12} color={colors.muted} />
            <Text style={styles.taskTime}>{task.time}</Text>
          </View>
        </View>
        <Text style={styles.taskDetail}>{task.detail}</Text>
        <View style={styles.taskActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ checked: isConfirmed }}
            accessibilityLabel={`${isConfirmed ? "Unconfirm" : "Confirm"} ${task.title}`}
            onPressIn={() => {
              setPressed(true);
              press.setValue(0.975);
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
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSkipped }}
            accessibilityLabel={`${isSkipped ? "Unskip" : "Skip"} ${task.title}`}
            onPress={() => onUpdate(task.id, isSkipped ? "not-confirmed" : "skipped")}
            style={({ pressed: isPressed }) => [styles.skipButton, isSkipped && styles.skippedButton, isPressed && styles.pressed]}
          >
            <Ionicons
              name={isSkipped ? "arrow-undo" : "arrow-forward"}
              size={13}
              color={isSkipped ? colors.blush : colors.muted}
            />
            <Text style={[styles.skipButtonText, isSkipped && styles.skippedButtonText]}>
              {isSkipped ? "Skipped" : "Skip"}
            </Text>
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
    padding: 15,
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
    marginRight: 12,
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
    gap: 8,
  },
  taskTitle: { color: colors.ink, fontSize: 15, fontWeight: "600", flex: 1, letterSpacing: -0.2 },
  taskTitleDone: { color: colors.muted, textDecorationLine: "line-through" },
  taskTimeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  taskTime: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  taskDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  taskActions: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 12 },
  confirmButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.blueWash,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  confirmedButton: { backgroundColor: colors.blue, borderColor: colors.blue },
  confirmButtonText: { color: colors.blue, fontSize: 12, fontWeight: "600" },
  confirmedButtonText: { color: colors.white },
  skipButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  skippedButton: { borderColor: colors.borderSoft, backgroundColor: colors.white },
  skipButtonText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  skippedButtonText: { color: colors.blush },
  pressed: { opacity: 0.72 },
});
