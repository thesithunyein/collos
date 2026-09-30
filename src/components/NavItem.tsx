import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useReduceMotion } from "../platform/motion";
import { colors, motion, nativeAnimDriver, space, type } from "../theme";

/**
 * A bottom-tab item with a springy active state. The icon springs up a few
 * percent when its tab becomes active and settles back when it does not —
 * the label simply swaps tint, so an inactive tab is never dimmed into
 * invisibility. The whole control reports itself to assistive tech as a
 * selected tab.
 *
 * Built only on the built-in `Animated` API — the native driver animates on
 * the UI thread, so the tab keeps its snap even on a busy frame. No new
 * dependencies, by project policy.
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
  const reduceMotion = useReduceMotion();
  // The icon grows slightly when active; it never shrinks below full size, so
  // every tab stays visible at rest.
  const iconScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  useEffect(() => {
    // With reduce motion on, the capsule and the icon still change — they just
    // arrive at once instead of springing, and the tab is never left mid-tween.
    if (reduceMotion) {
      lift.setValue(active ? 1 : 0);
      return;
    }
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      // A touch of overshoot reads as "alive" without bouncing enough to
      // smear on a screen recording.
      ...motion.spring.lift,
      useNativeDriver: nativeAnimDriver,
    }).start();
  }, [active, lift, reduceMotion]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      /*
       * `aria-selected` is set as well as `accessibilityState`.
       *
       * On web, react-native-web does not translate `accessibilityState` into
       * `aria-selected` on a `tab` role, so the active tab was reachable and
       * labelled but never announced as the current one — a screen reader heard
       * three tabs and no answer to "where am I". Setting both is not belt and
       * braces: `accessibilityState` is what native reads and `aria-selected` is
       * what the browser reads.
       */
      aria-selected={active}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
    >
      {/* The luma-style wash capsule behind the active tab's icon.
         
          The capsule and the icon animate separately on purpose. The capsule
          fades in with the spring, so the selection reads as held rather than
          merely tinted. The icon does not fade — it only scales — because
          fading it is what made the two unselected tabs look like bare labels:
          at rest the whole icon was at 0% opacity, so the bar showed one icon
          and two words. All three icons are now drawn all the time. */}
      <View style={styles.iconWell}>
        <Animated.View style={[styles.iconWellFill, { opacity: lift }]} />
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons name={icon} size={22} color={active ? colors.blue : colors.muted} />
        </Animated.View>
      </View>
      {/* Capped, not free: the bar is a fixed 68pt capsule, so letting a
          maxed-out text setting scale the label would push it out of the
          control it belongs to. Body copy is left to scale however it likes. */}
      <Text
        maxFontSizeMultiplier={1.3}
        style={[styles.navLabel, active && styles.navLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navItem: {
    minWidth: 84,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xxs,
  },
  navItemPressed: { opacity: 0.72 },
  /**
   * The icon's fixed slot. It carries the size, so the bar never reflows as the
   * capsule appears and disappears; the capsule is the fill behind it.
   */
  iconWell: {
    width: 62,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  /** The luma-style wash capsule that fades in under the active tab's icon. */
  iconWellFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 18,
    backgroundColor: colors.blueWash,
  },
  // Luma's tab bar separates its states by weight as well as tint: an inactive
  // label sits back, the active one is genuinely bold. Weight alone would be too
  // subtle at 11pt, so tint and weight move together — and both of them do.
  // They were documented here as moving together but were both set to 600, so
  // the active tab was carried by colour alone.
  navLabel: { ...type.micro, color: colors.muted },
  navLabelActive: { color: colors.blue, fontWeight: "700" },
});
