import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { CareRecipient } from "../data/mockCare";
import { colors } from "../theme";

type Member = {
  id: string;
  name: string;
  role: string;
  initials: string;
  /** "mine" people are the recipients you care for. */
  kind: "you" | "recipient" | "helper";
  confirmedToday: boolean;
};

function buildMembers(recipients: CareRecipient[]): Member[] {
  // Named deliberately so they cannot collide with `mockRecipients`, which is the
  // people being cared for rather than the people doing the caring.
  const helpers: Member[] = [
    { id: "aisha", name: "Aisha", role: "Sister · evening check-ins", initials: "A", kind: "helper", confirmedToday: true },
    { id: "marcus", name: "Marcus", role: "Cousin · weekends", initials: "M", kind: "helper", confirmedToday: false },
  ];
  return [
    { id: "you", name: "Sithu", role: "You · care organiser", initials: "S", kind: "you", confirmedToday: true },
    ...recipients.map((recipient) => ({
      id: recipient.id,
      name: recipient.name,
      role: recipient.relationship,
      initials: recipient.initials,
      kind: "recipient" as const,
      confirmedToday: recipient.tasks.some((task) => task.status === "confirmed"),
    })),
    ...helpers,
  ];
}

export function CircleScreen({
  recipients,
  pro,
  onUnlock,
  onInvite,
}: {
  recipients: CareRecipient[];
  pro: boolean;
  onUnlock: () => void;
  onInvite: () => void;
}) {
  const members = buildMembers(recipients);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>CARE CIRCLE</Text>
        <Text style={styles.title}>Everyone helping out</Text>
        <Text style={styles.subtitle}>
          One place to see who is checking in, and who still needs a hand this week.
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>people</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{members.filter((m) => m.confirmedToday).length}</Text>
            <Text style={styles.statLabel}>checked in</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pro ? "∞" : "1"}</Text>
            <Text style={styles.statLabel}>shared notes</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>MEMBERS</Text>
        <View style={styles.memberList}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View
                style={[
                  styles.memberAvatar,
                  member.kind === "you" && styles.memberAvatarYou,
                  member.kind === "helper" && styles.memberAvatarHelper,
                ]}
              >
                <Text
                  style={[
                    styles.memberInitials,
                    (member.kind === "you" || member.kind === "helper") && styles.memberInitialsInverted,
                  ]}
                >
                  {member.initials}
                </Text>
              </View>
              <View style={styles.memberCopy}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              {member.confirmedToday ? (
                <View style={styles.donePill}>
                  <Ionicons name="checkmark" size={12} color={colors.green} />
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

        {pro ? (
          <View style={styles.unlockedCard}>
            <View style={styles.unlockedHeader}>
              <Ionicons name="people" size={19} color={colors.blue} />
              <Text style={styles.unlockedTitle}>Invites are unlocked</Text>
            </View>
            <Text style={styles.unlockedText}>
              Add anyone you trust to {recipients[0]?.name ?? "your circle"}. They will only see the
              plan items you share with them.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onInvite}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="person-add" size={17} color={colors.white} />
              <Text style={styles.primaryButtonText}>Invite someone</Text>
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
            <Text style={styles.lockedTitle}>Invite more people</Text>
            <Text style={styles.lockedText}>
              Inviting more than one helper is part of Collos Pro. Pro adds unlimited invites and
              shared notes for everyone in your circle.
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
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  statRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 3, letterSpacing: 0.3 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 26,
    marginBottom: 10,
  },
  memberList: { gap: 9 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarYou: { backgroundColor: colors.blue },
  memberAvatarHelper: { backgroundColor: colors.purpleWash },
  memberInitials: { color: colors.blue, fontSize: 15, fontWeight: "800" },
  memberInitialsInverted: { color: colors.white },
  memberCopy: { flex: 1 },
  memberName: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  memberRole: { color: colors.muted, fontSize: 11, marginTop: 2 },
  donePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.greenWash,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  donePillText: { color: colors.green, fontSize: 10, fontWeight: "800" },
  pendingPill: { backgroundColor: colors.soft, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 },
  pendingPillText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  unlockedCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.blue,
    padding: 16,
    marginTop: 22,
  },
  unlockedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockedTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  unlockedText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  lockedCard: {
    backgroundColor: colors.blueWash,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD9FF",
    padding: 16,
    marginTop: 22,
  },
  lockedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  lockIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedBadge: { color: colors.blue, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  lockedTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 10 },
  lockedText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 15,
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
