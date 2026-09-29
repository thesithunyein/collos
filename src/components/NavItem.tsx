import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { colors, nativeAnimDriver } from "../theme";

/**
 * A bottom-tab item with a springy active state. The icon lifts and settles on
 * a small spring while the label cross-fades between the muted and blue tints;
 * the whole control reports itself to assistive tech as a selected tab.
 *
 * Built only on the built-in `Animated` API — the native driver animates on the
 * UI thread, so the tab keeps its snap even on a busy frame from the demo
 * screen-recording. No new dependencies, by project policy.
 */
export function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  // Start the lift at 1 so a component that mounts already-active (deep link,
  // tab restored across a restart) doesn't play a spurious pop.
  const lift = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      // A touch of overshoot reads as "alive" without bouncing the label
      // enough to smear on a screen recording.
      friction: 6,
      tension: 190,
      useNativeDriver: nativeAnimDriver,
    }).start();
  }, [active, lift]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
    >
      <Animated.View style={{ transform: [{ scale: lift }] }}>
        <Ionicons name={icon} size={21} color={active ? colors.blue : colors.muted} />
      </Animated.View>
      <Animated.Text style={[styles.navLabel, { opacity: lift }, active && styles.navLabelActive]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navItem: { minWidth: 70, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 4 },
  navItemPressed: { opacity: 0.72 },
  navLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  navLabelActive: { color: colors.blue },
});
