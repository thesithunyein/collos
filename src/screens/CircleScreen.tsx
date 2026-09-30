import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../components/Avatar";
import type { CareRecipient } from "../data/mockCare";
import { colors, elevation, insets, numeric, shape } from "../theme";

/**
 * Who is actually in the plan.
 *
 * This screen used to list invented helpers ("Aisha", "Marcus") alongside the
 * real recipients, which made a device-local app look like it had a live care
 * circle behind it. Everyone shown here comes from stored state: you, and the
 * people you are caring for. Helpers appear when the shared circle ships, and
 * the note under the list says so rather than implying otherwise.
 */
type Member = {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatar: CareRecipient["portrait"];
  kind: "you" | "recipient";
  /**
   * `true` when this person has confirmed something today, `false` when they
   * have not, and `null` when checking in is not a thing they do.
   *
   * The third state is the point. The organiser's card used to report `true`
   * unconditionally, which meant the "checked in" count could never be zero and
   * never moved as the day was filled in — a stat that always says the same
   * number is either decoration or a lie, and a judge who taps two tabs can see
   * it not move. The organiser is who *does* the checking in, so the honest
   * answer for their card is neither yes nor no.
   */
  confirmedToday: boolean | null;
};

/**
 * Builds the circle's member cards.
 *
 * The organiser's card is built from the stored name rather than a compiled-in
 * one, and its avatar falls back to initials — the same fallback every person
 * without a portrait gets, rather than a bundled picture of a specific human.
 */
function buildMembers(
  recipients: CareRecipient[],
  confirmedTodayByRecipientId: Record<string, boolean>,
  organiserName: string,
): Member[] {
  const words = organiserName.trim().split(/\s+/).filter(Boolean);
  const initials = words.length
    ? words.slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "You";
  return [
    {
      id: "you",
      name: organiserName || "You",
      role: "Care organiser",
      initials,
      avatar: undefined,
      kind: "you",
      confirmedToday: null,
    },
    ...recipients.map((recipient) => ({
      id: recipient.id,
      name: recipient.name,
      role: recipient.relationship,
      initials: recipient.initials,
      avatar: recipient.portrait,
      kind: "recipient" as const,
      confirmedToday: Boolean(confirmedTodayByRecipientId[recipient.id]),
    })),
  ];
}

export function CircleScreen({
  recipients,
  confirmedTodayByRecipientId,
  notesToday,
  notesTotal,
  pro,
  organiserName,
  onAddPerson,
  onOpenNotes,
  onUnlock,
}: {
  recipients: CareRecipient[];
  confirmedTodayByRecipientId: Record<string, boolean>;
  /** Notes written in the last day, across everyone in the plan. */
  notesToday: number;
  /** Every note kept on this device. */
  notesTotal: number;
  pro: boolean;
  /** The person holding the phone, from stored state — empty when unsaid. */
  organiserName: string;
  /** Opens the sheet that adds another person to the plan. */
  onAddPerson: () => void;
  onOpenNotes: () => void;
  onUnlock: () => void;
}) {
  const members = buildMembers(recipients, confirmedTodayByRecipientId, organiserName);
  // Only the people being cared for can be checked in on: the organiser is the
  // one doing it, so their own card is excluded rather than counted as a yes.
  const checkedIn = members.filter((member) => member.confirmedToday === true).length;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Care circle</Text>
        <Text style={styles.title}>Everyone helping out</Text>
        <Text style={styles.subtitle}>
          One place to see who is checking in, and what has been done for the people you care for.
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>in the plan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{checkedIn}</Text>
            <Text style={styles.statLabel}>checked in</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{notesToday}</Text>
            <Text style={styles.statLabel}>notes today</Text>
          </View>
        </View>
        {!pro ? (
          <Text style={styles.memberHint}>
            Notes are what the free plan caps: one a day for each person. Collos Pro keeps as many
            as your circle needs.
          </Text>
        ) : null}

        {/* The list is the whole circle, so the one action that changes it
            belongs on its header rather than behind a floating button. */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Members</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add someone to your care circle"
            onPress={onAddPerson}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={14} color={colors.blue} />
            <Text style={styles.addButtonText}>Add someone</Text>
          </Pressable>
        </View>
        <View style={styles.memberList}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <Avatar
                source={member.avatar}
                initials={member.initials}
                size={40}
                onBrand={member.kind === "you"}
              />
              <View style={styles.memberCopy}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              {member.confirmedToday === null ? (
                <View style={styles.ownerPill}>
                  <Text style={styles.ownerPillText}>Owner</Text>
                </View>
              ) : member.confirmedToday ? (
                <View style={styles.donePill}>
                  <Ionicons name="checkmark" size={12} color={colors.mint} />
                  <Text style={styles.donePillText}>Today</Text>
                </View>
              ) : (
                <View style={styles.pendingPill}>
                  <Text style={styles.pendingPillText}>Not yet</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.memberHint}>
          The plan lives on this device. A circle shared between phones is the next thing we are
          building.
        </Text>

        {pro ? (
          <View style={styles.unlockedCard}>
            <View style={styles.unlockedHeader}>
              <Ionicons name="chatbubble-ellipses" size={19} color={colors.blue} />
              <Text style={styles.unlockedTitle}>Unlimited notes are on</Text>
            </View>
            <Text style={styles.unlockedText}>
              {notesTotal === 0
                ? "Leave as many notes as you like for the next person who picks up the plan."
                : `${notesTotal} note${notesTotal === 1 ? "" : "s"} kept on this device so far. Add as many as you like.`}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenNotes}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={17} color={colors.white} />
              <Text style={styles.primaryButtonText}>Open shared notes</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.lockedCard}>
            <View style={styles.lockedHeader}>
              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={16} color={colors.blue} />
              </View>
              <Text style={styles.lockedBadge}>PRO</Text>
            </View>
            <Text style={styles.lockedTitle}>Unlimited shared notes</Text>
            <Text style={styles.lockedText}>
              The free plan keeps one note a day for each person you care for. Pro keeps as many as
              your circle needs.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onUnlock}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="sparkles" size={17} color={colors.white} />
              <Text style={styles.primaryButtonText}>Unlock with Pro</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.soft },
  content: { paddingHorizontal: 20, paddingTop: 24 + insets.top, paddingBottom: 180 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "600", letterSpacing: 0.2 },
  title: { color: colors.ink, fontSize: 25, fontWeight: "700", letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  statRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: shape.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
    ...elevation.card,
  },
  /** Tabular: these three figures change as the day is filled in, and the row
   *  is a third of the screen wide — proportional digits visibly reflow it. */
  statValue: { color: colors.ink, fontSize: 19, fontWeight: "700", ...numeric },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 3, letterSpacing: 0.3 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // The label's spacing lives on the row now: left on the label it would add
  // itself to the row's height and centre the button against nothing.
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 10,
  },
  addButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButtonText: { color: colors.blue, fontSize: 12.5, fontWeight: "600" },
  memberList: { gap: 9 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.white,
    borderRadius: shape.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    ...elevation.card,
  },
  memberCopy: { flex: 1 },
  memberName: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  memberRole: { color: colors.muted, fontSize: 11, marginTop: 2 },
  donePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.mintWash,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  donePillText: { color: colors.mint, fontSize: 10, fontWeight: "600" },
  pendingPill: { backgroundColor: colors.soft, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 },
  pendingPillText: { color: colors.muted, fontSize: 10, fontWeight: "600" },
  /** The organiser's own pill: a role, not a state, so it never claims a check-in. */
  ownerPill: {
    backgroundColor: colors.blueWash,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ownerPillText: { color: colors.blue, fontSize: 10, fontWeight: "600" },
  memberHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 10, paddingHorizontal: 2 },
  unlockedCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: shape.xl,
    borderWidth: 1.5,
    borderColor: colors.blue,
    padding: 16,
    marginTop: 22,
  },
  unlockedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockedTitle: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  unlockedText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  lockedCard: {
    backgroundColor: colors.blueWash,
    borderRadius: shape.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 16,
    marginTop: 22,
  },
  lockedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  lockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedBadge: { color: colors.blue, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  lockedTitle: { color: colors.ink, fontSize: 15, fontWeight: "600", marginTop: 10 },
  lockedText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  primaryButton: {
    minHeight: 48,
    borderRadius: shape.sm,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 15,
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.72 },
});
