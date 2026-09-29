import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { CareTask, TaskStatus } from "../data/mockCare";
import { colors, nativeAnimDriver, shape } from "../theme";

// Tone keys are stored with each saved moment, so they keep their old names even
// though the colours behind them now come from the logo's palette.
const TONES = {
  blue: { background: colors.blueWash, icon: colors.blue },
  orange: { background: colors.blushWash, icon: colors.blush },
  green: { background: colors.mintWash, icon: colors.mint },
  purple: { background: colors.lilacWash, icon: colors.lilac },
} as const;

/**
 * One moment on today's plan. The check button now *moves*: a quick press
 * shrinks the card a few percent and springs it back on release, so a confirm
 * reads as a physical action rather than a repaint — this is the tap a demo
 * video leans on, so it should feel the best in the app.
 */
export function TaskCard({
  task,
  onUpdate,
}: {
  task: CareTask;
  onUpdate: (id: string, status: TaskStatus) => void;
}) {
  const isConfirmed = task.status === "confirmed";
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
        { transform: [{ scale: press }] },
      ]}
    >
      <View style={[styles.taskIcon, { backgroundColor: tone.background }]}>
        <Ionicons name={task.icon} size={20} color={tone.icon} />
      </View>
      <View style={styles.taskCopy}>
        <View style={styles.taskTitleRow}>
          <Text style={[styles.taskTitle, isConfirmed && styles.taskTitleDone]}>{task.title}</Text>
          <Text style={styles.taskTime}>{task.time}</Text>
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
              size={15}
              color={isConfirmed ? colors.white : colors.blue}
            />
            <Text style={[styles.confirmButtonText, isConfirmed && styles.confirmedButtonText]}>
              {isConfirmed ? "Confirmed" : "Confirm"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Skip ${task.title}`}
            onPress={() => onUpdate(task.id, "skipped")}
            style={({ pressed: isPressed }) => [styles.skipButton, isPressed && styles.pressed]}
          >
            <Text style={styles.skipButtonText}>{task.status === "skipped" ? "Skipped" : "Skip"}</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: shape.lg,
    padding: 14,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskCardConfirmed: { borderColor: colors.borderSoft },
  taskIcon: {
    width: 43,
    height: 43,
    borderRadius: shape.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  taskCopy: { flex: 1 },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  taskTitle: { color: colors.ink, fontSize: 14, fontWeight: "800", flex: 1 },
  taskTitleDone: { color: colors.muted, textDecorationLine: "line-through" },
  taskTime: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  taskDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  taskActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  confirmButton: {
    minHeight: 35,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confirmedButton: { backgroundColor: colors.blue, borderColor: colors.blue },
  confirmButtonText: { color: colors.blue, fontSize: 11, fontWeight: "800" },
  confirmedButtonText: { color: colors.white },
  skipButton: { minHeight: 35, paddingHorizontal: 8, justifyContent: "center" },
  skipButtonText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
