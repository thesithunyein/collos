import React, { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { NavItem } from "./src/components/NavItem";
import { PaywallModal } from "./src/components/PaywallModal";
import { CareRecipient, mockRecipients, TaskStatus } from "./src/data/mockCare";
import { CircleScreen } from "./src/screens/CircleScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { colors } from "./src/theme";
import { usePro } from "./src/purchases/usePro";

type Stage = "onboarding" | "app";
type Tab = "Today" | "Circle" | "Settings";

export default function App() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [tab, setTab] = useState<Tab>("Today");
  const [recipientId, setRecipientId] = useState(mockRecipients[0].id);
  const [tasks, setTasks] = useState(mockRecipients[0].tasks);
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");

  const pro = usePro();

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

  // Close the paywall a beat after a successful unlock so the user lands back on
  // the screen that just opened up.
  useEffect(() => {
    if (!pro.pro || !isPaywallOpen) return;
    const timer = setTimeout(() => {
      setPaywallOpen(false);
      showNotice("Collos Pro unlocked — shared notes and invites are open.");
    }, 1100);
    return () => clearTimeout(timer);
  }, [pro.pro, isPaywallOpen]);

  const enterApp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStage("app");
    }, 350);
  };

  const selectRecipient = (nextRecipient: CareRecipient) => {
    setRecipientId(nextRecipient.id);
    setTasks(nextRecipient.tasks);
  };

  const updateTask = (taskId: string, status: TaskStatus) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const retryLoad = () => {
    setLoadError(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 450);
  };

  if (stage === "onboarding") {
    return (
      <View style={styles.viewport}>
        <View style={styles.frame}>
          <OnboardingScreen isLoading={isLoading} onStart={enterApp} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.viewport}>
      <View style={styles.frame}>
        {tab === "Today" ? (
          <TodayScreen
            recipients={mockRecipients}
            recipient={recipient}
            tasks={tasks}
            completedCount={completedCount}
            progress={progress}
            isLoading={isLoading}
            loadError={loadError}
            pro={pro.pro}
            onSelectRecipient={selectRecipient}
            onUpdateTask={updateTask}
            onRetry={retryLoad}
            onAddRecipient={() =>
              showNotice(
                pro.pro
                  ? "Recipient invites are ready to connect."
                  : "Inviting more recipients is part of Collos Pro.",
              )
            }
            onEditPlan={() => showNotice("Plan editing is ready for the next build.")}
            onAddMoment={() => showNotice("Add a moment is ready for the next build.")}
            onOpenPaywall={() => setPaywallOpen(true)}
            onOpenSharedNotes={() => showNotice("Your shared notes will appear here.")}
          />
        ) : tab === "Circle" ? (
          <CircleScreen
            recipients={mockRecipients}
            pro={pro.pro}
            onUnlock={() => setPaywallOpen(true)}
            onInvite={() => showNotice("Send an invite link to anyone you trust.")}
          />
        ) : (
          <SettingsScreen pro={pro} />
        )}

        <View style={styles.bottomNav}>
          <NavItem icon="grid-outline" label="Today" active={tab === "Today"} onPress={() => setTab("Today")} />
          <NavItem icon="people-outline" label="Circle" active={tab === "Circle"} onPress={() => setTab("Circle")} />
          <NavItem
            icon="settings-outline"
            label="Settings"
            active={tab === "Settings"}
            onPress={() => setTab("Settings")}
          />
        </View>

        {notice ? (
          <View accessibilityLiveRegion="polite" style={styles.notice}>
            <Ionicons name="information-circle-outline" size={17} color={colors.blue} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <PaywallModal
          visible={isPaywallOpen}
          onClose={() => {
            setPaywallOpen(false);
            pro.clearMessage();
          }}
          pro={pro}
        />
      </View>
    </View>
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
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 76,
    paddingBottom: 10,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  notice: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 88,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  noticeText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 17 },
});
