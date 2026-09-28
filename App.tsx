import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CareRecipient,
  CareTask,
  mockRecipients,
  TaskStatus,
} from "./src/data/mockCare";

type Screen = "onboarding" | "dashboard";

const colors = {
  ink: "#15243D",
  muted: "#66758F",
  soft: "#F5F7FB",
  backdrop: "#E4E9F4",
  border: "#E8ECF3",
  blue: "#2457F5",
  blueDark: "#173DBA",
  blueWash: "#EAF0FF",
  orange: "#F19B3B",
  orangeWash: "#FFF2DF",
  green: "#41A77A",
  greenWash: "#E7F6EE",
  purple: "#8B6CE8",
  purpleWash: "#F0EBFF",
  white: "#FFFFFF",
  danger: "#C75353",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [recipientId, setRecipientId] = useState(mockRecipients[0].id);
  const [tasks, setTasks] = useState(mockRecipients[0].tasks);
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeNav, setActiveNav] = useState("Today");
  const [notice, setNotice] = useState("");

  const recipient = useMemo(
    () => mockRecipients.find((item) => item.id === recipientId) ?? mockRecipients[0],
    [recipientId],
  );
  const completedCount = tasks.filter((task) => task.status === "confirmed").length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2800);
  };

  const enterDashboard = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen("dashboard");
    }, 350);
  };

  const selectRecipient = (nextRecipient: CareRecipient) => {
    setRecipientId(nextRecipient.id);
    setTasks(nextRecipient.tasks);
  };

  const updateTask = (taskId: string, status: TaskStatus) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
  };

  const retryLoad = () => {
    setLoadError(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 450);
  };

  const screenContent = screen === "onboarding" ? (
      <SafeAreaView style={styles.onboarding}>
        <StatusBar style="light" />
        <View style={styles.onboardingTop}>
          <View style={styles.logoMark}>
            <Ionicons name="heart" size={22} color={colors.blue} />
          </View>
          <Text style={styles.wordmark}>collos</Text>
        </View>
        <View style={styles.onboardingArt} accessible accessibilityLabel="A calm blue sun illustration">
          <View style={styles.sunHalo} />
          <View style={styles.sun}>
            <Ionicons name="sunny" size={52} color={colors.blue} />
          </View>
          <View style={[styles.spark, styles.sparkOne]} />
          <View style={[styles.spark, styles.sparkTwo]} />
          <View style={[styles.spark, styles.sparkThree]} />
        </View>
        <View style={styles.onboardingCopy}>
          <Text style={styles.onboardingTitle}>Care, together.</Text>
          <Text style={styles.onboardingSubtitle}>
            A simple place to share the small moments that help someone feel supported.
          </Text>
          <View style={styles.trustNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.white} />
            <Text style={styles.trustText}>
              Collos is for care coordination, not medical advice.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Set up my care circle"
            onPress={enterDashboard}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.blue} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Set up my care circle</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.blue} />
              </>
            )}
          </Pressable>
          <Text style={styles.onboardingFooter}>Private by design · Built for everyday care</Text>
        </View>
      </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.app}>
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
          </Pressable>
        </View>

        <View style={styles.recipientSwitcher}>
          <Text style={styles.sectionLabel}>CARING FOR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recipientRow}>
            {mockRecipients.map((item) => {
              const isSelected = item.id === recipient.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => selectRecipient(item)}
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
              onPress={() => showNotice("Recipient invites will be available when shared care circles are connected.")}
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
            <Pressable accessibilityRole="button" onPress={retryLoad} style={styles.retryButton}>
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
                <Text style={styles.sectionMeta}>{completedCount} of {tasks.length} confirmed</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => showNotice("Plan editing is ready for the next build.")} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Edit plan</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.blue} />
              </Pressable>
            </View>

            {tasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={28} color={colors.blue} />
                <Text style={styles.emptyTitle}>No moments planned yet</Text>
                <Text style={styles.emptyText}>Add a small check-in so your care circle knows what matters today.</Text>
                <Pressable accessibilityRole="button" onPress={() => showNotice("Add a moment is ready for the next build.")} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Add a moment</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.taskList}>
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTask} />
                ))}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Collos Pro"
              onPress={() => setPaywallOpen(true)}
              style={({ pressed }) => [styles.proCard, pressed && styles.pressed]}
            >
              <View style={styles.proIcon}>
                <Ionicons name="sparkles" size={18} color={colors.white} />
              </View>
              <View style={styles.proCopy}>
                <View style={styles.proTitleRow}>
                  <Text style={styles.proTitle}>Make care feel lighter</Text>
                  <Text style={styles.proBadge}>PRO</Text>
                </View>
                <Text style={styles.proText}>Shared notes, reminders, and more space for your circle.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.blue} />
            </Pressable>

            <View style={styles.safetyNote}>
              <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              <Text style={styles.safetyText}>
                Collos helps coordinate care. It does not provide medical advice or replace a care professional.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem icon="grid-outline" label="Today" active={activeNav === "Today"} onPress={() => setActiveNav("Today")} />
        <NavItem icon="people-outline" label="Circle" active={activeNav === "Circle"} onPress={() => showNotice("Your care circle will live here.")} />
        <NavItem icon="settings-outline" label="Settings" active={activeNav === "Settings"} onPress={() => showNotice("Settings are coming in a future build.")} />
      </View>
      {notice ? <View accessibilityLiveRegion="polite" style={styles.notice}><Ionicons name="information-circle-outline" size={17} color={colors.blue} /><Text style={styles.noticeText}>{notice}</Text></View> : null}
      <PaywallModal visible={isPaywallOpen} onClose={() => setPaywallOpen(false)} />
    </SafeAreaView>
  );

  return (
    <View style={styles.viewport}>
      <View style={styles.frame}>{screenContent}</View>
    </View>
  );
}

function TaskCard({ task, onUpdate }: { task: CareTask; onUpdate: (id: string, status: TaskStatus) => void }) {
  const isConfirmed = task.status === "confirmed";
  const tone = {
    blue: { background: colors.blueWash, icon: colors.blue },
    orange: { background: colors.orangeWash, icon: colors.orange },
    green: { background: colors.greenWash, icon: colors.green },
    purple: { background: colors.purpleWash, icon: colors.purple },
  }[task.tone];

  return (
    <View style={styles.taskCard}>
      <View style={[styles.taskIcon, { backgroundColor: tone.background }]}>
        <Ionicons name={task.icon} size={20} color={tone.icon} />
      </View>
      <View style={styles.taskCopy}>
        <View style={styles.taskTitleRow}>
          <Text style={[styles.taskTitle, isConfirmed && styles.taskTitleDone]}>{task.title}</Text>
          <Text style={styles.taskTime}>{task.time}</Text>
        </View>
        <Text style={styles.taskDetail}>{task.detail}</Text>
        <View style={styles.taskActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ checked: isConfirmed }}
            onPress={() => onUpdate(task.id, isConfirmed ? "not-confirmed" : "confirmed")}
            style={({ pressed }) => [styles.confirmButton, isConfirmed && styles.confirmedButton, pressed && styles.pressed]}
          >
            <Ionicons name={isConfirmed ? "checkmark" : "checkmark-outline"} size={15} color={isConfirmed ? colors.white : colors.blue} />
            <Text style={[styles.confirmButtonText, isConfirmed && styles.confirmedButtonText]}>
              {isConfirmed ? "Confirmed" : "Confirm"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onUpdate(task.id, "skipped")}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
          >
            <Text style={styles.skipButtonText}>{task.status === "skipped" ? "Skipped" : "Skip"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={styles.navItem}>
      <Ionicons name={icon} size={21} color={active ? colors.blue : colors.muted} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function PaywallModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Pressable accessibilityRole="button" accessibilityLabel="Close paywall" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.modalIcon}>
            <Ionicons name="sparkles" size={26} color={colors.blue} />
          </View>
          <Text style={styles.modalTitle}>More room for care</Text>
          <Text style={styles.modalText}>Keep your circle in sync with shared notes, gentle reminders, and an unlimited care plan.</Text>
          <View style={styles.featureList}>
            {["Invite more people to your care circle", "Save shared notes in one calm place", "Get gentle reminders when you choose"].map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={19} color={colors.green} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.modalPrimaryButton}>
            <Text style={styles.modalPrimaryText}>Continue with Pro</Text>
          </Pressable>
          <Text style={styles.storeNote}>Web preview only · Native store purchases are not available here</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.backdrop,
    flexDirection: "column",
    alignItems: "center",
  },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    overflow: "hidden",
    backgroundColor: colors.soft,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  onboarding: { flex: 1, backgroundColor: colors.blue, paddingHorizontal: 24 },
  onboardingTop: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 18 },
  logoMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  wordmark: { color: colors.white, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  onboardingArt: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 280 },
  sunHalo: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.09)" },
  sun: { width: 126, height: 126, borderRadius: 63, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  spark: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#90B4FF" },
  sparkOne: { top: "30%", left: "22%" },
  sparkTwo: { top: "21%", right: "23%", width: 8, height: 8 },
  sparkThree: { bottom: "28%", right: "20%", width: 16, height: 16, borderRadius: 8 },
  onboardingCopy: { paddingBottom: 22 },
  onboardingTitle: { color: colors.white, fontSize: 42, lineHeight: 46, fontWeight: "800", letterSpacing: -1.4 },
  onboardingSubtitle: { color: "#DCE7FF", fontSize: 17, lineHeight: 25, marginTop: 14, maxWidth: 330 },
  trustNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 25 },
  trustText: { color: "#DCE7FF", fontSize: 12, lineHeight: 18, flex: 1 },
  primaryButton: { backgroundColor: colors.white, minHeight: 54, borderRadius: 17, marginTop: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryButtonText: { color: colors.blue, fontSize: 16, fontWeight: "800" },
  onboardingFooter: { color: "#ABC5FF", fontSize: 11, textAlign: "center", marginTop: 17 },
  app: { flex: 1, backgroundColor: colors.soft },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 105 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 20, paddingBottom: 24 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  greeting: { color: colors.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.blueWash, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.blue, fontSize: 17, fontWeight: "800" },
  recipientSwitcher: { marginBottom: 20 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginBottom: 10 },
  recipientRow: { gap: 10, paddingRight: 4 },
  recipientChip: { minWidth: 126, minHeight: 60, backgroundColor: colors.white, borderRadius: 17, padding: 10, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: colors.border },
  recipientChipSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  smallAvatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.blueWash, alignItems: "center", justifyContent: "center" },
  smallAvatarSelected: { backgroundColor: "rgba(255,255,255,0.22)" },
  smallAvatarText: { color: colors.blue, fontWeight: "800" },
  smallAvatarTextSelected: { color: colors.white },
  chipName: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  chipNameSelected: { color: colors.white },
  chipRelationship: { color: colors.muted, fontSize: 11, marginTop: 2 },
  chipRelationshipSelected: { color: "#DCE7FF" },
  addRecipient: { minHeight: 60, minWidth: 66, borderRadius: 17, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 2, backgroundColor: colors.white },
  addRecipientText: { color: colors.blue, fontSize: 11, fontWeight: "700" },
  heroCard: { backgroundColor: colors.blue, borderRadius: 24, padding: 21, flexDirection: "row", justifyContent: "space-between", overflow: "hidden", marginBottom: 26 },
  heroContent: { flex: 1, paddingRight: 8 },
  heroKicker: { color: "#BFD1FF", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  heroTitle: { color: colors.white, fontSize: 22, lineHeight: 27, fontWeight: "800", marginTop: 10, letterSpacing: -0.5 },
  heroText: { color: "#DCE7FF", fontSize: 13, lineHeight: 19, marginTop: 8 },
  progressRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 5, borderColor: "#7D9DFF", alignItems: "center", justifyContent: "center", marginTop: 4 },
  progressValue: { color: colors.white, fontSize: 16, fontWeight: "800" },
  progressLabel: { color: "#DCE7FF", fontSize: 10, marginTop: 1 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 13 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  sectionMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  viewAllButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { color: colors.blue, fontSize: 12, fontWeight: "800" },
  taskList: { gap: 10 },
  taskCard: { backgroundColor: colors.white, borderRadius: 20, padding: 14, flexDirection: "row", borderWidth: 1, borderColor: colors.border },
  taskIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  taskCopy: { flex: 1 },
  taskTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  taskTitle: { color: colors.ink, fontSize: 14, fontWeight: "800", flex: 1 },
  taskTitleDone: { color: colors.muted, textDecorationLine: "line-through" },
  taskTime: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  taskDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  taskActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  confirmButton: { minHeight: 35, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: "#C9D7FF", flexDirection: "row", alignItems: "center", gap: 4 },
  confirmedButton: { backgroundColor: colors.blue, borderColor: colors.blue },
  confirmButtonText: { color: colors.blue, fontSize: 11, fontWeight: "800" },
  confirmedButtonText: { color: colors.white },
  skipButton: { minHeight: 35, paddingHorizontal: 8, justifyContent: "center" },
  skipButtonText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  proCard: { backgroundColor: "#EAF0FF", borderRadius: 19, padding: 14, marginTop: 23, flexDirection: "row", alignItems: "center", gap: 11 },
  proIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  proCopy: { flex: 1 },
  proTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  proTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  proBadge: { color: colors.blue, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  proText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  safetyNote: { flexDirection: "row", gap: 7, alignItems: "flex-start", marginTop: 19, paddingHorizontal: 2 },
  safetyText: { color: colors.muted, fontSize: 11, lineHeight: 17, flex: 1 },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 76, paddingBottom: 10, backgroundColor: "rgba(255,255,255,0.98)", borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  navItem: { minWidth: 70, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  navLabelActive: { color: colors.blue },
  notice: { position: "absolute", left: 20, right: 20, bottom: 88, minHeight: 48, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, shadowColor: colors.ink, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  noticeText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 17 },
  pressed: { opacity: 0.72 },
  skeletonStack: { gap: 12 },
  skeleton: { height: 112, borderRadius: 22, backgroundColor: "#E6EAF2" },
  skeletonHero: { height: 154 },
  errorCard: { backgroundColor: "#FFF3F3", borderColor: "#F3D7D7", borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  errorCopy: { flex: 1 },
  errorTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  errorText: { color: colors.muted, fontSize: 11, marginTop: 3 },
  retryButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 10 },
  retryText: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  emptyCard: { backgroundColor: colors.white, borderRadius: 20, alignItems: "center", padding: 26, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 10 },
  emptyText: { color: colors.muted, textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 6 },
  secondaryButton: { minHeight: 42, backgroundColor: colors.blueWash, borderRadius: 12, justifyContent: "center", paddingHorizontal: 15, marginTop: 15 },
  secondaryButtonText: { color: colors.blue, fontSize: 12, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(21,36,61,0.42)", justifyContent: "flex-end", alignItems: "center" },
  modalCard: { width: "100%", maxWidth: 430, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 31 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 },
  closeButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  modalIcon: { width: 55, height: 55, borderRadius: 18, backgroundColor: colors.blueWash, alignItems: "center", justifyContent: "center", marginTop: 3 },
  modalTitle: { color: colors.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.7, marginTop: 15 },
  modalText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  featureList: { gap: 13, marginTop: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  featureText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  modalPrimaryButton: { minHeight: 52, borderRadius: 16, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", marginTop: 25 },
  modalPrimaryText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  storeNote: { color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 12 },
});
