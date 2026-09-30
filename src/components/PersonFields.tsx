import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PORTRAITS, RELATIONSHIPS } from "../data/care";
import { colors, shape, space, type } from "../theme";
import { Avatar } from "./Avatar";

/**
 * Who a person is, as fields.
 *
 * Shared by setup and the "Add someone" sheet rather than written twice: the two
 * screens are asking the same question, and the moment they diverge the app has
 * two ideas of what a person is. Both place these on a white card, so the
 * styling here is the styling in both.
 *
 * The portrait row is the reason this is worth sharing at all. A person the app
 * has not been given a picture of falls back to their initial, and this app only
 * stopped drawing everyone as a letter when it was given faces — so the choice
 * is offered consistently everywhere a person is created instead of only to the
 * first one.
 */
export function PersonFields({
  name,
  onName,
  relationship,
  onRelationship,
  portraitId,
  onPortrait,
  onSubmitEditing,
  autoFocus = false,
}: {
  name: string;
  onName: (value: string) => void;
  relationship: string;
  onRelationship: (value: string) => void;
  portraitId?: string;
  onPortrait: (value: string | undefined) => void;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>Their name</Text>
      <TextInput
        accessibilityLabel="Their name"
        placeholder="e.g. Margaret"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={onName}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        maxLength={40}
        style={styles.input}
      />

      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>You are their</Text>
      <View style={styles.chipRow}>
        {RELATIONSHIPS.map((option) => {
          const picked = relationship === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: picked }}
              accessibilityLabel={`${option}, relationship`}
              onPress={() => onRelationship(option)}
              style={({ pressed }) => [styles.chip, picked && styles.chipOn, pressed && styles.pressed]}
            >
              <Text style={[styles.chipText, picked && styles.chipTextOn]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Add a picture</Text>
      <View style={styles.portraitRow}>
        {PORTRAITS.map((portrait, index) => {
          const picked = portraitId === portrait.id;
          return (
            <Pressable
              key={portrait.id}
              accessibilityRole="button"
              accessibilityState={{ selected: picked }}
              accessibilityLabel={`Portrait ${index + 1}`}
              // Tapping the chosen one again clears it, which is the only way
              // back to initials without adding another control.
              onPress={() => onPortrait(picked ? undefined : portrait.id)}
              style={({ pressed }) => [
                styles.portraitPick,
                picked && styles.portraitPickOn,
                pressed && styles.pressed,
              ]}
            >
              <Avatar source={portrait.source} initials="?" size={42} />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldHint}>
        Optional. Without one they show as their initial — the same fallback your contacts use.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { ...type.callout, fontWeight: "600", color: colors.ink },
  fieldLabelSpaced: { marginTop: space.xxxl },
  input: {
    marginTop: space.sm,
    minHeight: 50,
    borderRadius: shape.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.soft,
    paddingHorizontal: space.xl,
    color: colors.ink,
    // 16pt so the browser does not zoom the page when the field takes focus.
    fontSize: 16,
    fontWeight: "500",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.md,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: space.xl,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { ...type.subhead, color: colors.ink },
  chipTextOn: { color: colors.white },
  portraitRow: { flexDirection: "row", gap: space.md, marginTop: space.md },
  portraitPick: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: "transparent" },
  portraitPickOn: { borderColor: colors.blue },
  fieldHint: { ...type.caption, color: colors.muted, marginTop: space.md },
  pressed: { opacity: 0.72 },
});
