import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { colors, nativeAnimDriver } from "../theme";

/**
 * A bottom-tab item with a springy active state. The icon springs up a few
 * percent when its tab becomes active and settles back when it does not —
 * the label simply swaps tint, so an inactive tab is never dimmed into
 * invisibility. The whole control reports itself to assistive tech as a
 * selected tab.
 *
 * Built only on the built-in `Animated` API — the native driver animates on
 * the UI thread, so the tab keeps its snap even on a busy frame from the demo
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
  // 0 = resting, 1 = active. Starts at the right value so a tab that mounts
  // already active doesn't play a spurious pop.
  const lift = useRef(new Animated.Value(active ? 1 : 0)).current;
  // The icon GROWS when active; it never shrinks below full size, so every
  // tab stays visible at rest.
  const iconScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });

  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      // A touch of overshoot reads as "alive" without bouncing enough to
      // smear on a screen recording.
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
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Ionicons name={icon} size={21} color={active ? colors.blue : colors.muted} />
      </Animated.View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navItem: { minWidth: 70, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 4 },
  navItemPressed: { opacity: 0.72 },
  navLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  navLabelActive: { color: colors.blue },
});
