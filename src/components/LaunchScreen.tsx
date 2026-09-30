import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { useReduceMotion } from "../platform/motion";
import { colors, motion, nativeAnimDriver, space, type } from "../theme";

/**
 * The cold-start screen.
 *
 * This used to be a bare `ActivityIndicator` on the backdrop, which was the
 * loudest tell that the app was not finished: a spinner is what a prototype
 * shows while it waits, whereas a shipping app opens on its own mark. The
 * restore read takes only a few frames, so this is deliberately *quiet* — the
 * mark eases up from 96% and fades in over a third of a second, and if the read
 * finishes first the user sees a settled badge rather than a flicker.
 *
 * The halo is layered translucent circles rather than a real blur: React Native
 * has no blur without `expo-blur`, and pulling in an unpinned native module
 * late in the project is the exact risk the `expo-font` incident taught us to
 * avoid. Three stacked circles at different opacities read the same at this
 * size.
 */
export function LaunchScreen() {
  const enter = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    // With reduce motion on the mark is simply there, fully opaque and at rest:
    // the screen still looks like Collos, it just does not perform arriving.
    if (reduceMotion) {
      enter.setValue(1);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: motion.duration.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeAnimDriver,
    }).start();
  }, [enter, reduceMotion]);

  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View
      style={styles.launch}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Collos is starting"
    >
      <Animated.View style={[styles.badgeWrap, { opacity: enter, transform: [{ scale }] }]}>
        {/* Halo: layered translucent discs, widest and faintest first. */}
        <View style={[styles.halo, styles.haloOuter]} pointerEvents="none" />
        <View style={[styles.halo, styles.haloMid]} pointerEvents="none" />
        <View style={[styles.halo, styles.haloInner]} pointerEvents="none" />
        <View style={styles.badge}>
          <Image
            source={require("../../assets/logo-mark.png")}
            style={styles.badgeImage}
            accessible={false}
          />
        </View>
      </Animated.View>
      <Animated.Text style={[styles.wordmark, { opacity: enter }]}>collos</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  launch: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    // Nudged above true centre so the mark plus wordmark sit optically centred.
    paddingBottom: 40,
  },
  badgeWrap: { alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", borderRadius: 999 },
  haloOuter: { width: 250, height: 250, backgroundColor: "rgba(154,191,243,0.16)" },
  haloMid: { width: 196, height: 196, backgroundColor: "rgba(154,191,243,0.20)" },
  haloInner: { width: 146, height: 146, backgroundColor: "rgba(47,99,214,0.12)" },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  badgeImage: { width: "100%", height: "100%" },
  wordmark: {
    ...type.display,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: space.huge,
  },
});
