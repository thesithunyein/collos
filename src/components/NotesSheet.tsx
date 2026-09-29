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
import type { StoredNote } from "../storage/careStore";
import { colors, insets, nativeAnimDriver, shape } from "../theme";

/**
 * Shared notes: the one feature Collos Pro actually sells, so it has to work.
 *
 * Every note is written to device-local storage the moment it is saved and is
 * still there after a restart. The sheet says plainly that notes live on this
 * device rather than implying they travel between phones — the plan is shared
 * the same way today, and a screen that overclaimed would be the same drift the
 * paywall copy was cleaned up to remove.
 *
 * The free plan keeps one note a day per recipient; Pro keeps as many as you
 * like. The limit is enforced here, not just described.
 */
export function NotesSheet({
  visible,
  recipientName,
  notes,
  pro,
  notesLeftToday,
  onClose,
  onSave,
  onUnlock,
}: {
  visible: boolean;
  recipientName: string;
  notes: StoredNote[];
  pro: boolean;
  notesLeftToday: number;
  onClose: () => void;
  onSave: (text: string) => void;
  onUnlock: () => void;
}) {
  const [draft, setDraft] = useState("");

  // A reopened sheet never shows the previous half-typed note.
  useEffect(() => {
    if (!visible) setDraft("");
  }, [visible]);

  const canWrite = pro || notesLeftToday > 0;
  const trimmed = draft.trim();
  const canSave = canWrite && trimmed.length > 0 && trimmed.length <= 160;

  const save = () => {
    if (!canSave) return;
    onSave(trimmed);
    setDraft("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.handle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close notes"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>

          <Text style={styles.title}>Shared notes</Text>
          <Text style={styles.subtitle}>
            Leave a note for the next person who picks up {recipientName}&rsquo;s plan. Notes are
            kept on this device and stay after a restart.
          </Text>

          {canWrite ? (
            <>
              <Text style={styles.fieldLabel}>NEW NOTE</Text>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={`e.g. She was cheerful after lunch today`}
                placeholderTextColor={colors.placeholder}
                maxLength={160}
                multiline
                accessibilityLabel="Note"
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSave }}
                disabled={!canSave}
                onPress={save}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canSave && styles.primaryButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.primaryButtonText}>Save note</Text>
              </Pressable>
              {!pro ? (
                <Text style={styles.limitHint}>
                  {notesLeftToday > 0
                    ? "Free keeps one note a day — today’s is still open."
                    : "Free keeps one note a day."}
                </Text>
              ) : null}
            </>
          ) : (
            <View style={styles.limitCard}>
              <View style={styles.limitHeader}>
                <View style={styles.lockIcon}>
                  <Ionicons name="lock-closed" size={15} color={colors.blue} />
                </View>
                <Text style={styles.limitBadge}>PRO</Text>
              </View>
              <Text style={styles.limitTitle}>One note a day</Text>
              <Text style={styles.limitText}>
                Today&rsquo;s note is saved and stays on this device. Collos Pro keeps as many as your
                circle needs.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onUnlock}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Ionicons name="sparkles" size={17} color={colors.white} />
                <Text style={styles.primaryButtonText}>Unlock unlimited notes</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.sectionLabel}>
            {notes.length === 0
              ? "NO NOTES YET"
              : `${notes.length} NOTE${notes.length === 1 ? "" : "S"} ON THIS DEVICE`}
          </Text>
          {notes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.blue} />
              <Text style={styles.emptyText}>
                Notes you keep for {recipientName} show up here, newest first.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.noteList}
              contentContainerStyle={styles.noteListContent}
              showsVerticalScrollIndicator={false}
            >
              {notes.map((note) => (
                <View key={note.id} style={styles.noteRow}>
                  <View style={styles.noteIcon}>
                    <Ionicons name="chatbubble-ellipses" size={15} color={colors.blue} />
                  </View>
                  <View style={styles.noteCopy}>
                    <Text style={styles.noteText}>{note.text}</Text>
                    <Text style={styles.noteMeta}>{formatNoteDay(note.day)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** `2026-09-29` -> `Today`, `Yesterday`, or `29 Sep`. */
function formatNoteDay(day: string): string {
  const today = new Date();
  const key = (date: Date) =>
    `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
  if (day === key(today)) return "Today";
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (day === key(yesterday)) return "Yesterday";
  const [year, month, date] = day.split("-").map((part) => Number(part));
  if (!year || !month || !date) return day;
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
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
    borderTopLeftRadius: shape.xl,
    borderTopRightRadius: shape.xl,
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
    borderRadius: shape.sm,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  title: { color: colors.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.6, marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  fieldLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    minHeight: 74,
    borderRadius: shape.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.soft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 14,
    textAlignVertical: "top",
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  primaryButtonDisabled: { backgroundColor: colors.blueDisabled },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  limitHint: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 10 },
  limitCard: {
    backgroundColor: colors.blueWash,
    borderRadius: shape.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 16,
    marginTop: 18,
  },
  limitHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  lockIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  limitBadge: { color: colors.blue, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  limitTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 10 },
  limitText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: shape.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.soft,
  },
  emptyText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },
  noteList: { maxHeight: 210 },
  noteListContent: { gap: 9, paddingBottom: 4 },
  noteRow: {
    flexDirection: "row",
    gap: 11,
    padding: 13,
    borderRadius: shape.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  noteCopy: { flex: 1 },
  noteText: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  noteMeta: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 5 },
  pressed: { opacity: 0.72 },
});
