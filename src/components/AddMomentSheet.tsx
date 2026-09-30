import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CareTask, RepeatRule, TaskTemplate } from "../data/mockCare";
import { REPEAT_LABELS, REPEAT_RULES } from "../data/mockCare";
import { colors, insets, shape, space, type } from "../theme";

/**
 * The moment sheet: one surface for adding a moment and for editing one.
 *
 * It began as add-only — a stub that just raised a notice was replaced because
 * the Next Gen walkthrough requires the app to feel fully featured, and an
 * add-flow that adds nothing is exactly what the video-must-match-the-app rule
 * exists to catch. The same argument applies to a plan you cannot revise: a care
 * plan changes weekly, and an app that can only append is a demo, not a tool.
 * So the sheet now carries the full life of a moment: create it, change it,
 * move it to another day, delete it.
 *
 * The four icon/tone pairs mirror the built-in moment types, so a custom moment
 * is indistinguishable from a pre-planned one on the Today screen.
 */

const KINDS: Array<{
  key: TaskTemplate["icon"];
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
  editing = null,
  onSave,
  onDelete,
  onDefer,
  movedTo = null,
}: {
  visible: boolean;
  onClose: () => void;
  /** Add mode. Receives a moment with no id; the store mints one. */
  onSubmit: (moment: Omit<TaskTemplate, "id">) => void;
  /** Non-null puts the sheet in edit mode, pre-filled from this moment. */
  editing?: CareTask | null;
  /** Edit mode. Patches the moment in place, keeping its id and its status. */
  onSave?: (id: string, patch: Omit<TaskTemplate, "id">) => void;
  onDelete?: (id: string) => void;
  /** Moves the moment to another day, or back to today with `null`. */
  onDefer?: (id: string, day: string | null) => void;
  /** Where the moment has been moved to, if anywhere. Drives the toggle's label. */
  movedTo?: string | null;
}) {
  const isEditing = Boolean(editing);

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [time, setTime] = useState(TIMES[0]);
  const [repeat, setRepeat] = useState<RepeatRule>("daily");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed whenever the sheet opens, so it shows the moment being edited
  // rather than whatever was typed last, and a reopened add-sheet is blank
  // instead of holding the previous moment half-typed.
  useEffect(() => {
    if (!visible) return;
    setConfirmDelete(false);
    if (editing) {
      setTitle(editing.title);
      setDetail(editing.detail);
      setKind(KINDS.find((item) => item.key === editing.icon) ?? KINDS[0]);
      setTime(editing.time);
      setRepeat(editing.repeat ?? "daily");
    } else {
      setTitle("");
      setDetail("");
      setKind(KINDS[0]);
      setTime(TIMES[0]);
      setRepeat("daily");
    }
  }, [visible, editing]);

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 60;

  // A moment invented before this had custom times keeps whichever it has, by
  // adding it to the row instead of silently snapping it to Morning.
  const timeOptions = TIMES.includes(time) ? TIMES : [time, ...TIMES];

  const buildPatch = (): Omit<TaskTemplate, "id"> => ({
    title: trimmed,
    detail:
      detail.trim() ||
      KINDS.find((item) => item.key === kind.key)?.detailPlaceholder.replace(/^e\.g\. /, "") ||
      "",
    time,
    icon: kind.key,
    tone: kind.tone,
    repeat,
  });

  const submit = () => {
    if (!canSubmit) return;
    if (editing) onSave?.(editing.id, buildPatch());
    else onSubmit(buildPatch());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.cardContent}
          >
            <View style={styles.handle} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>

            <Text style={styles.title}>{isEditing ? "Edit moment" : "Add a moment"}</Text>
            <Text style={styles.subtitle}>
              {isEditing
                ? "Change the details, or move it to another day. Its place in today’s plan is kept."
                : "One small thing that matters today. Everyone’s plan shows it straight away."}
            </Text>

            {/* Only offered on a moment that exists: there is nothing to move or
                delete before it has been created. */}
            {editing ? (
              <View style={styles.lifeRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    movedTo ? "Bring this moment back to today" : "Move this moment to tomorrow"
                  }
                  onPress={() => onDefer?.(editing.id, movedTo ? null : nextDayKey())}
                  style={({ pressed }) => [styles.lifeButton, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={movedTo ? "arrow-undo" : "arrow-forward"}
                    size={15}
                    color={colors.blue}
                  />
                  <Text style={styles.lifeButtonText}>
                    {movedTo ? "Bring back to today" : "Move to tomorrow"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

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
            <View style={styles.chipRow}>
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
            <View style={styles.chipRow}>
              {timeOptions.map((item) => {
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
                    <Text style={[styles.kindText, selected && styles.kindTextSelected]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Real care is only mostly daily: the bins go out on Tuesdays and
                the district nurse comes on weekdays. A rule per moment is what
                lets a plan be someone's actual week instead of a fixed four. */}
            <Text style={styles.fieldLabel}>HOW OFTEN</Text>
            <View style={styles.chipRow}>
              {REPEAT_RULES.map((rule) => {
                const selected = rule === repeat;
                return (
                  <Pressable
                    key={rule}
                    accessibilityRole="radio"
                    aria-checked={selected}
                    accessibilityLabel={REPEAT_LABELS[rule].label}
                    onPress={() => setRepeat(rule)}
                    style={({ pressed }) => [
                      styles.kindChip,
                      selected && styles.kindChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.kindText, selected && styles.kindTextSelected]}>
                      {REPEAT_LABELS[rule].label}
                    </Text>
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
              <Text style={styles.primaryButtonText}>
                {isEditing ? "Save changes" : "Add to today’s plan"}
              </Text>
            </Pressable>

            {editing && onDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  confirmDelete ? "Tap again to delete this moment" : "Delete this moment"
                }
                onPress={() => {
                  // Two taps, never one. A destructive control on the same
                  // sheet as the save button is one slip from losing a moment
                  // someone planned, and there is no undo to fall back on.
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  onDelete(editing.id);
                }}
                style={({ pressed }) => [
                  styles.deleteButton,
                  confirmDelete && styles.deleteButtonArmed,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={15}
                  color={confirmDelete ? colors.white : colors.danger}
                />
                <Text
                  style={[
                    styles.deleteButtonText,
                    confirmDelete && styles.deleteButtonTextArmed,
                  ]}
                >
                  {confirmDelete ? "Tap again to delete" : "Delete moment"}
                </Text>
              </Pressable>
            ) : null}

            <Text style={styles.hint}>
              {isEditing
                ? movedTo
                  ? "This moment is waiting on another day. Its status is open until then."
                  : "Moments are kept on this device. A move keeps the moment — nothing is lost by skipping."
                : "Moments are kept on this device and come back on the days you choose."}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Tomorrow's `YYYY-MM-DD`, computed locally rather than from UTC. */
function nextDayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
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
  },
  cardContent: {
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
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  title: { ...type.title, color: colors.ink, marginTop: space.xxs },
  subtitle: { ...type.callout, color: colors.muted, marginTop: space.xs },
  lifeRow: { flexDirection: "row", marginTop: space.lg },
  lifeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    minHeight: 38,
    paddingHorizontal: space.lg,
    borderRadius: 12,
    backgroundColor: colors.blueWash,
  },
  lifeButtonText: { ...type.caption, color: colors.blue },
  fieldLabel: {
    ...type.tag,
    color: colors.muted,
    letterSpacing: 0.2,
    marginTop: space.xxxl,
    marginBottom: space.sm,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.soft,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    color: colors.ink,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 68, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  kindChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: space.lg,
  },
  kindChipSelected: { borderColor: colors.blue, backgroundColor: colors.blueWash },
  kindText: { ...type.caption, color: colors.ink, fontWeight: "700" },
  kindTextSelected: { color: colors.blue },
  primaryButton: {
    minHeight: 52,
    borderRadius: shape.sm,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.huge,
  },
  primaryButtonDisabled: { backgroundColor: colors.blueDisabled },
  primaryButtonText: { ...type.subhead, color: colors.white },
  deleteButton: {
    minHeight: 46,
    borderRadius: shape.sm,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorWash,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    marginTop: space.md,
  },
  deleteButtonArmed: { backgroundColor: colors.danger, borderColor: colors.danger },
  deleteButtonText: { ...type.caption, color: colors.danger },
  deleteButtonTextArmed: { color: colors.white },
  hint: {
    ...type.micro,
    color: colors.muted,
    fontWeight: "400",
    textAlign: "center",
    marginTop: space.lg,
  },
  pressed: { opacity: 0.72 },
});
