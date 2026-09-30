import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, insets, shape, space, type } from "../theme";
import { PersonFields } from "./PersonFields";

/**
 * "Add someone" — the second, third and fourth person in a plan.
 *
 * This exists because the people in the circle stopped being built in. Before,
 * two of them came with the app; now the user creates the first one during
 * setup, which left no way to ever create another — and the Today screen's
 * "Caring for" row, the Circle screen's member list and the landing page's
 * "add the people in your plan" all describe a circle that can hold several.
 * A capability the interface asks for has to exist somewhere.
 *
 * It asks the same three things setup asks, from the same component, so the two
 * cannot drift into two definitions of a person.
 */
export function AddPersonSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (person: { name: string; relationship: string; portraitId?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [portraitId, setPortraitId] = useState<string | undefined>(undefined);

  // Reset on close, so reopening never shows the last person half-typed.
  useEffect(() => {
    if (!visible) {
      setName("");
      setRelationship("");
      setPortraitId(undefined);
    }
  }, [visible]);

  const canSubmit = name.trim().length > 0 && relationship.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), relationship, portraitId });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.handle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>

          <Text style={styles.title}>Add someone</Text>
          <Text style={styles.subtitle}>
            Another person you help look after. Each one keeps their own plan, and you can switch
            between them in one tap.
          </Text>

          {/* The fields are taller than the sheet on a short window, and the
              primary button sits outside the scroll so it can never be pushed
              off the bottom by the keyboard. */}
          <ScrollView
            style={styles.fields}
            contentContainerStyle={styles.fieldsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <PersonFields
              name={name}
              onName={setName}
              relationship={relationship}
              onRelationship={setRelationship}
              portraitId={portraitId}
              onPortrait={setPortraitId}
            />
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add to my plan"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={submit}
            style={({ pressed }) => [
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Add to my plan</Text>
          </Pressable>
          <Text style={styles.hint}>
            {canSubmit
              ? "Their plan starts empty, and everything you log stays on this device."
              : "Add a name and pick a relationship to continue."}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "92%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.huge,
    paddingTop: space.lg,
    paddingBottom: space.huge + insets.bottom,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: space.lg,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: shape.sm,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  title: { ...type.title, color: colors.ink, marginTop: space.xxs },
  subtitle: { ...type.callout, color: colors.muted, marginTop: space.xs },
  fields: { marginTop: space.xxxl },
  fieldsContent: { paddingBottom: space.xs },
  primaryButton: {
    minHeight: 52,
    borderRadius: shape.sm,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.xxxl,
  },
  primaryButtonDisabled: { backgroundColor: colors.blueDisabled },
  primaryButtonText: { ...type.subhead, color: colors.white },
  hint: {
    ...type.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: space.lg,
  },
  pressed: { opacity: 0.72 },
});
