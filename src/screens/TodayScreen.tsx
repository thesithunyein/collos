import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TaskCard } from "../components/TaskCard";
import type { CareRecipient, CareTask, TaskStatus } from "../data/mockCare";
import { colors } from "../theme";

export type TodayScreenProps = {
  recipients: CareRecipient[];
  recipient: CareRecipient;
  tasks: CareTask[];
  completedCount: number;
  progress: number;
  isLoading: boolean;
  loadError: boolean;
  pro: boolean;
  onSelectRecipient: (recipient: CareRecipient) => void;
  onUpdateTask: (taskId: string, status: TaskStatus) => void;
  onRetry: () => void;
  onAddRecipient: () => void;
  onEditPlan: () => void;
  onAddMoment: () => void;
  onOpenPaywall: () => void;
  onOpenSharedNotes: () => void;
};

export function TodayScreen({
  recipients,
  recipient,
  tasks,
  completedCount,
  progress,
  isLoading,
  loadError,
  pro,
  onSelectRecipient,
  onUpdateTask,
  onRetry,
  onAddRecipient,
  onEditPlan,
  onAddMoment,
  onOpenPaywall,
  onOpenSharedNotes,
}: TodayScreenProps) {
  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>FRIDAY, 14 JUNE</Text>
            <Text style={styles.greeting}>Good morning, Sithu</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>S</Text>
            {pro ? (
              <View style={styles.proDot}>
                <Ionicons name="sparkles" size={9} color={colors.white} />
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.recipientSwitcher}>
          <Text style={styles.sectionLabel}>CARING FOR</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipientRow}
          >
            {recipients.map((item) => {
              const isSelected = item.id === recipient.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Care for ${item.name}, ${item.relationship}`}
                  onPress={() => onSelectRecipient(item)}
                  style={({ pressed }) => [
                    styles.recipientChip,
                    isSelected && styles.recipientChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.smallAvatar, isSelected && styles.smallAvatarSelected]}>
                    <Text style={[styles.smallAvatarText, isSelected && styles.smallAvatarTextSelected]}>
                      {item.initials}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.chipName, isSelected && styles.chipNameSelected]}>{item.name}</Text>
                    <Text style={[styles.chipRelationship, isSelected && styles.chipRelationshipSelected]}>
                      {item.relationship}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a care recipient"
              onPress={onAddRecipient}
              style={({ pressed }) => [styles.addRecipient, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={20} color={colors.blue} />
              <Text style={styles.addRecipientText}>Add</Text>
            </Pressable>
          </ScrollView>
        </View>

        {loadError ? (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Couldn’t load today’s plan</Text>
              <Text style={styles.errorText}>Check your connection and try again.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.skeletonStack} accessibilityLabel="Loading care plan">
            <View style={[styles.skeleton, styles.skeletonHero]} />
            <View style={styles.skeleton} />
            <View style={styles.skeleton} />
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroContent}>
                <Text style={styles.heroKicker}>TODAY’S CARE PLAN</Text>
                <Text style={styles.heroTitle}>A little goes a long way.</Text>
                <Text style={styles.heroText}>
                  You’re helping {recipient.name} feel remembered and supported.
                </Text>
              </View>
              <View style={styles.progressRing}>
                <Text style={styles.progressValue}>{progress}%</Text>
                <Text style={styles.progressLabel}>done</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Today’s moments</Text>
                <Text style={styles.sectionMeta}>
                  {completedCount} of {tasks.length} confirmed
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onEditPlan}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>Edit plan</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.blue} />
              </Pressable>
            </View>

            {tasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={28} color={colors.blue} />
                <Text style={styles.emptyTitle}>No moments planned yet</Text>
                <Text style={styles.emptyText}>
                  Add a small check-in so your care circle knows what matters today.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={onAddMoment}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Add a moment</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.taskList}>
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={onUpdateTask} />
                ))}
              </View>
            )}

            <SharedNotesStrip pro={pro} onOpen={onOpenSharedNotes} onUnlock={onOpenPaywall} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Collos Pro"
              onPress={onOpenPaywall}
              style={({ pressed }) => [styles.proCard, pressed && styles.pressed]}
            >
              <View style={styles.proIcon}>
                <Ionicons name="sparkles" size={18} color={colors.white} />
              </View>
              <View style={styles.proCopy}>
                <View style={styles.proTitleRow}>
                  <Text style={styles.proTitle}>
                    {pro ? "Collos Pro is active" : "Make care feel lighter"}
                  </Text>
                  <Text style={styles.proBadge}>PRO</Text>
                </View>
                <Text style={styles.proText}>
                  {pro
                    ? "Shared notes, invites, and reminders are unlocked."
                    : "Shared notes, reminders, and more space for your circle."}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.blue} />
            </Pressable>

            <View style={styles.safetyNote}>
              <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              <Text style={styles.safetyText}>
                Collos helps coordinate care. It does not provide medical advice or replace a care
                professional.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * The surface that proves the entitlement does something: free users see a
 * locked preview, Pro users get the real thing.
 */
function SharedNotesStrip({
  pro,
  onOpen,
  onUnlock,
}: {
  pro: boolean;
  onOpen: () => void;
  onUnlock: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pro ? "Open shared notes" : "Unlock shared notes with Collos Pro"}
      onPress={pro ? onOpen : onUnlock}
      style={({ pressed }) => [styles.notesCard, pressed && styles.pressed]}
    >
      <View style={styles.notesIcon}>
        <Ionicons name={pro ? "chatbubble-ellipses" : "lock-closed"} size={17} color={colors.blue} />
      </View>
      <View style={styles.notesCopy}>
        <View style={styles.notesTitleRow}>
          <Text style={styles.notesTitle}>Shared notes</Text>
          {!pro ? <Text style={styles.notesLockBadge}>PRO</Text> : null}
        </View>
        <Text style={styles.notesText}>
          {pro
            ? "“Mum loved the window flowers.” — added by Daniel, 2h ago"
            : "Everyone in your circle can leave one calm note a day."}
        </Text>
      </View>
      <Ionicons name={pro ? "chevron-forward" : "lock-closed-outline"} size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.soft },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 105 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 24,
  },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  greeting: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginTop: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.blue, fontSize: 17, fontWeight: "800" },
  proDot: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.soft,
  },
  recipientSwitcher: { marginBottom: 20 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  recipientRow: { gap: 10, paddingRight: 4 },
  recipientChip: {
    minWidth: 126,
    minHeight: 60,
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipientChipSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  smallAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatarSelected: { backgroundColor: "rgba(255,255,255,0.22)" },
  smallAvatarText: { color: colors.blue, fontWeight: "800" },
  smallAvatarTextSelected: { color: colors.white },
  chipName: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  chipNameSelected: { color: colors.white },
  chipRelationship: { color: colors.muted, fontSize: 11, marginTop: 2 },
  chipRelationshipSelected: { color: colors.blueTint },
  addRecipient: {
    minHeight: 60,
    minWidth: 66,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: colors.white,
  },
  addRecipientText: { color: colors.blue, fontSize: 11, fontWeight: "700" },
  heroCard: {
    backgroundColor: colors.blue,
    borderRadius: 24,
    padding: 21,
    flexDirection: "row",
    justifyContent: "space-between",
    overflow: "hidden",
    marginBottom: 26,
  },
  heroContent: { flex: 1, paddingRight: 8 },
  heroKicker: { color: "#BFD1FF", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
    marginTop: 10,
    letterSpacing: -0.5,
  },
  heroText: { color: colors.blueTint, fontSize: 13, lineHeight: 19, marginTop: 8 },
  progressRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: "#7D9DFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  progressValue: { color: colors.white, fontSize: 16, fontWeight: "800" },
  progressLabel: { color: colors.blueTint, fontSize: 10, marginTop: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  sectionMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  viewAllButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { color: colors.blue, fontSize: 12, fontWeight: "800" },
  taskList: { gap: 10 },
  notesCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 18,
  },
  notesIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  notesCopy: { flex: 1 },
  notesTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  notesTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  notesLockBadge: { color: colors.blue, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  notesText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  proCard: {
    backgroundColor: colors.blueWash,
    borderRadius: 19,
    padding: 14,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  proIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  proCopy: { flex: 1 },
  proTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  proTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  proBadge: { color: colors.blue, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  proText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  safetyNote: { flexDirection: "row", gap: 7, alignItems: "flex-start", marginTop: 19, paddingHorizontal: 2 },
  safetyText: { color: colors.muted, fontSize: 11, lineHeight: 17, flex: 1 },
  pressed: { opacity: 0.72 },
  skeletonStack: { gap: 12 },
  skeleton: { height: 112, borderRadius: 22, backgroundColor: "#E6EAF2" },
  skeletonHero: { height: 154 },
  errorCard: {
    backgroundColor: "#FFF3F3",
    borderColor: "#F3D7D7",
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorCopy: { flex: 1 },
  errorTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  errorText: { color: colors.muted, fontSize: 11, marginTop: 3 },
  retryButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 10 },
  retryText: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    alignItems: "center",
    padding: 26,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 10 },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  secondaryButton: {
    minHeight: 42,
    backgroundColor: colors.blueWash,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 15,
    marginTop: 15,
  },
  secondaryButtonText: { color: colors.blue, fontSize: 12, fontWeight: "800" },
});
