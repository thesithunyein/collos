import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../theme";

/**
 * A person, as a face.
 *
 * This exists because the app used to draw every person as a lettered square —
 * `S`, `M`, `D` on tinted fills — which is what a wireframe does before it has
 * been given real content. It read as a mockup no matter how finished the rest
 * of the screen was, and it was the one thing in the demo that could not be
 * argued away.
 *
 * Two deliberate details:
 *
 * - **The letter fallback stays.** It is not a leftover. Contacts, Mail and
 *   every other mature app fall back to initials for a person with no picture,
 *   so the tinted letter is a designed state rather than a placeholder. What
 *   changed is that it is now the exception instead of the only option.
 * - **Circular, not rounded-square.** Photos are round in every app that has
 *   them, and the reference design draws its own icon wells as circles, so the
 *   round form is what makes the portrait read as a person rather than a tile.
 */
export function Avatar({
  source,
  initials,
  size = 36,
  /** On a brand-blue surface the hairline ring has to invert to stay visible. */
  onBrand = false,
  style,
}: {
  source?: ImageSourcePropType;
  /** Shown when there is no picture. Required so the fallback is never blank. */
  initials: string;
  size?: number;
  onBrand?: boolean;
  style?: ViewStyle;
}) {
  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.frame, frame, onBrand && styles.frameOnBrand, style]}>
      {source ? (
        <Image
          source={source}
          style={styles.image}
          resizeMode="cover"
          // Decorative here: the accessible name is on the row or chip that
          // contains the avatar, so announcing it twice would be noise.
          accessible={false}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: Math.round(size * 0.38) },
            onBrand && styles.initialsOnBrand,
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueWash,
    borderWidth: 1,
    borderColor: colors.border,
  },
  /** On a blue chip the ring and fill both have to come from the surface. */
  frameOnBrand: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.45)",
  },
  image: { width: "100%", height: "100%" },
  initials: { color: colors.blue, fontWeight: "600" },
  initialsOnBrand: { color: colors.white },
});
