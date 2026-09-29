import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { StoredTask } from "../storage/careStore";
import type { CareTask } from "../data/mockCare";
import { colors, insets, shape } from "../theme";

/**
 * The "Add a moment" sheet. Replaces a stub that only raised a notice — the
 * walkthrough for the Next Gen Award is explicit that the app must "feel fully
 * featured", and an add-flow that adds nothing is the kind of thing the
 * video-must-match-the-app rule exists to catch.
 *
 * The four icon/tone pairs mirror the built-in moment types, so a custom moment
 * is indistinguishable from a pre-planned one on the Today screen.
 */

const KINDS: Array<{
  key: StoredTask["icon"];
  tone: CareTask["tone"];
  label: string;
  detailPlaceholder: string;
}> = [
  {
    key: "sunny-outline",
    tone: "blue",
    label: "Check-in",
    detailPlaceholder: "e.g. A quick hello to start the day",
  },
  {
    key: "water-outline",
    tone: "orange",
    label: "Wellbeing",
    detailPlaceholder: "e.g. Ask if she has had a drink",
  },
  {
    key: "walk-outline",
    tone: "green",
    label: "Fresh air",
    detailPlaceholder: "e.g. A gentle walk or time by the window",
  },
  {
    key: "chatbubble-ellipses-outline",
    tone: "purple",
    label: "Note to share",
    detailPlaceholder: "e.g. Share one good thing from today",
  },
];

const TIMES = ["Morning", "Midday", "Afternoon", "Evening"];

export function AddMomentSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (moment: Omit<StoredTask, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [time, setTime] = useState(TIMES[0]);

  // Reset the form when the sheet closes, so reopening it never shows the
  // previous moment half-typed.
  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDetail("");
      setKind(KINDS[0]);
      setTime(TIMES[0]);
    }
  }, [visible]);

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 60;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: trimmed,
      detail:
        detail.trim() ||
        KINDS.find((item) => item.key === kind.key)?.detailPlaceholder.replace(/^e\.g\. /, "") ||
        "",
      time,
      icon: kind.key,
      tone: kind.tone,
    });
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

          <Text style={styles.title}>Add a moment</Text>
          <Text style={styles.subtitle}>
            One small thing that matters today. Everyone’s plan shows it straight away.
          </Text>

          <Text style={styles.fieldLabel}>WHAT SHOULD HAPPEN</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Evening tea together"
            placeholderTextColor={colors.placeholder}
            maxLength={60}
            accessibilityLabel="Moment title"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>A SHORT NOTE (OPTIONAL)</Text>
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder={kind.detailPlaceholder}
            placeholderTextColor={colors.placeholder}
            maxLength={120}
            accessibilityLabel="Moment note"
            style={[styles.input, styles.inputMultiline]}
            multiline
          />

          <Text style={styles.fieldLabel}>KIND OF MOMENT</Text>
          <View style={styles.kindRow}>
            {KINDS.map((item) => {
              const selected = item.key === kind.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="radio"
                  aria-checked={selected}
                  accessibilityLabel={item.label}
                  onPress={() => setKind(item)}
                  style={({ pressed }) => [
                    styles.kindChip,
                    selected && styles.kindChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={item.key}
                    size={16}
                    color={selected ? colors.white : colors.blue}
                  />
                  <Text style={[styles.kindText, selected && styles.kindTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>WHEN</Text>
          <View style={styles.kindRow}>
            {TIMES.map((item) => {
              const selected = item === time;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  aria-checked={selected}
                  accessibilityLabel={item}
                  onPress={() => setTime(item)}
                  style={({ pressed }) => [
                    styles.kindChip,
                    selected && styles.kindChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.kindText, selected && styles.kindTextSelected]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={submit}
            style={({ pressed }) => [
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Add to today’s plan</Text>
          </Pressable>
          <Text style={styles.hint}>
            Moments are kept on this device and reappear every day until you reset the plan.
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24 + insets.bottom,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  title: { color: colors.ink, fontSize: 21, fontWeight: "700", letterSpacing: -0.5, marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  fieldLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.soft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 68, textAlignVertical: "top" },
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kindChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  kindChipSelected: { borderColor: colors.blue, backgroundColor: colors.blueWash },
  kindText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  kindTextSelected: { color: colors.blue },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  primaryButtonDisabled: { backgroundColor: colors.blueDisabled },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 12 },
  pressed: { opacity: 0.72 },
});
