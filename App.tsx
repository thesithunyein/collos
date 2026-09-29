import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LaunchScreen } from "./src/components/LaunchScreen";
import { NavItem } from "./src/components/NavItem";
import { PaywallModal } from "./src/components/PaywallModal";
import { AddMomentSheet } from "./src/components/AddMomentSheet";
import { NotesSheet } from "./src/components/NotesSheet";
import type { CareRecipient } from "./src/data/mockCare";
import { mockRecipients } from "./src/data/mockCare";
import type { TaskStatus } from "./src/data/mockCare";
import { CircleScreen } from "./src/screens/CircleScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { colors, insets, nativeAnimDriver, shape } from "./src/theme";
import { usePro } from "./src/purchases/usePro";
import {
  StoredState,
  StoredTask,
  clearStoredState,
  emptyStoredState,
  loadStoredState,
  newMomentId,
  notesForRecipient,
  notesLeftToday,
  saveStoredState,
  tasksForRecipient,
  todayKey,
  withActiveRecipient,
  withAddedNote,
  withCustomMoment,
  withResetDay,
  withTaskStatus,
} from "./src/storage/careStore";

type Stage = "onboarding" | "app";
type Tab = "today" | "circle" | "settings";

export default function App() {
  // `hydrated` gates first paint: without it the app renders the default plan,
  // then snaps to the persisted one — a visible flicker and, worse, a moment
  // where a tap on "Confirm" would write onto unpersisted state.
  const [hydrated, setHydrated] = useState(false);
  const [stored, setStored] = useState<StoredState>(emptyStoredState);
  const [stage, setStage] = useState<Stage>("onboarding");
  const [tab, setTab] = useState<Tab>("today");
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [isAddingMoment, setAddingMoment] = useState(false);
  const [isNotesOpen, setNotesOpen] = useState(false);

  /**
   * Switching tabs is a plain state change on purpose.
   *
   * This used to wrap the tab bar in an `Animated.View` to cross-fade it, which
   * quietly broke every sheet in the app: React Native Web renders `Modal`
   * inside the app tree, and a transformed ancestor becomes the containing
   * block for its `position: fixed` content, so the notes sheet, the add-moment
   * sheet and the paywall were laid out inside the 76px tab bar and clipped by
   * the frame instead of covering the screen. The tab icons still spring on
   * their own; navigation does not need a transition that costs correctness.
   */
  const changeTab = useCallback((nextTab: Tab) => setTab(nextTab), []);

  // The notice toast rises into place on the native driver when it appears;
  // exit stays instant because it is only 2.8s and a slow exit reads as lag.
  const noticeRise = useRef(new Animated.Value(0)).current;
  const [noticeShown, setNoticeShown] = useState(false);
  useEffect(() => {
    if (notice) {
      setNoticeShown(true);
      Animated.timing(noticeRise, {
        toValue: 1,
        duration: 240,
        useNativeDriver: nativeAnimDriver,
      }).start();
    } else {
      setNoticeShown(false);
      noticeRise.setValue(0);
    }
  }, [notice, noticeRise]);

  const pro = usePro();

  // On a wide screen the app is a phone-width column, so it gets a device frame:
  // without one it read as a bare slab of brand colour floating in the window.
  // Narrow viewports stay edge to edge, as a phone should.
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 560;

  // Restore once on launch. A failed read leaves `stored` empty and the app
  // opens fresh — the same never-failing contract as the purchases wrapper.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await loadStoredState();
      if (cancelled) return;
      if (restored) {
        setStored(restored);
        if (restored.seenOnboarding) setStage("app");
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recipient = useMemo(
    () =>
      mockRecipients.find((item) => item.id === stored.activeRecipientId) ?? mockRecipients[0],
    [stored.activeRecipientId],
  );
  // Tasks are derived, not owned: the stored statuses are the source of truth,
  // so there is exactly one place to persist and no state that can drift.
  const tasks = useMemo(() => tasksForRecipient(stored, recipient), [stored, recipient]);
  const completedCount = tasks.filter((task) => task.status === "confirmed").length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  // Notes are real, persisted state — the one paid feature, so the whole circle
  // screen and the Today strip read from it rather than from sample numbers.
  const recipientNotes = useMemo(() => notesForRecipient(stored, recipient.id), [stored, recipient]);
  const notesToday = useMemo(() => {
    const today = todayKey();
    return stored.notes.filter((note) => note.day === today).length;
  }, [stored.notes]);
  const confirmedTodayByRecipientId = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const item of mockRecipients) {
      result[item.id] = tasksForRecipient(stored, item).some((task) => task.status === "confirmed");
    }
    return result;
  }, [stored]);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2800);
  };

  // Every mutation goes through here: update, then persist. The ref keeps the
  // last state so rapid taps persist sequentially instead of racing.
  const storedRef = useRef(stored);
  storedRef.current = stored;
  const mutate = useCallback((next: StoredState) => {
    setStored(next);
    storedRef.current = next;
    void saveStoredState(next);
  }, []);

  // Close the paywall a beat after a successful unlock so the user lands back on
  // the screen that just opened up.
  useEffect(() => {
    if (!pro.pro || !isPaywallOpen) return;
    const timer = setTimeout(() => {
      setPaywallOpen(false);
      showNotice("Collos Pro unlocked — unlimited shared notes are on.");
    }, 1100);
    return () => clearTimeout(timer);
  }, [pro.pro, isPaywallOpen]);

  const enterApp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStage("app");
      mutate(withActiveRecipient(storedRef.current, mockRecipients[0].id));
    }, 350);
  };

  const selectRecipient = (nextRecipient: CareRecipient) => {
    mutate(withActiveRecipient(storedRef.current, nextRecipient.id));
  };

  const updateTask = (taskId: string, status: TaskStatus) => {
    mutate(withTaskStatus(storedRef.current, recipient.id, taskId, status));
  };

  const addMoment = (moment: Omit<StoredTask, "id">) => {
    const task: StoredTask = { ...moment, id: newMomentId() };
    mutate(withCustomMoment(storedRef.current, recipient.id, task));
    setAddingMoment(false);
    showNotice(`“${moment.title}” added to ${recipient.name}’s plan.`);
  };

  const resetDay = () => {
    mutate(withResetDay(storedRef.current, recipient.id));
    showNotice(`Today’s moments for ${recipient.name} are open again.`);
  };
  const saveNote = (text: string) => {
    mutate(withAddedNote(storedRef.current, recipient.id, text));
    showNotice(`Note saved for ${recipient.name} — kept on this device.`);
  };

  const openNotes = () => setNotesOpen(true);

  const resetAllData = async () => {
    await clearStoredState();
    setStored(emptyStoredState());
    storedRef.current = emptyStoredState();
    setStage("onboarding");
    setTab("today");
  };

  if (!hydrated) {
    return (
      <View style={[styles.viewport, isWide && styles.viewportWide]}>
        <View style={[styles.frame, isWide && styles.frameWide]}>
          <LaunchScreen />
        </View>
      </View>
    );
  }
  if (stage === "onboarding") {
    return (
      <View style={[styles.viewport, isWide && styles.viewportWide]}>
        <View style={[styles.frame, isWide && styles.frameWide]}>
          <OnboardingScreen isLoading={isLoading} onStart={enterApp} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.viewport, isWide && styles.viewportWide]}>
      <View style={[styles.frame, isWide && styles.frameWide]}>
        {tab === "today" ? (
          <TodayScreen
            recipients={mockRecipients}
            recipient={recipient}
            tasks={tasks}
            completedCount={completedCount}
            progress={progress}
            isLoading={isLoading}
            pro={pro.pro}
            noteCount={recipientNotes.length}
            onSelectRecipient={selectRecipient}
            onUpdateTask={updateTask}
            onEditPlan={resetDay}
            onAddMoment={() => setAddingMoment(true)}
            onOpenPaywall={() => setPaywallOpen(true)}
            onOpenNotes={openNotes}
            onOpenAccount={() => changeTab("settings")}
          />
        ) : tab === "circle" ? (
          <CircleScreen
            recipients={mockRecipients}
            confirmedTodayByRecipientId={confirmedTodayByRecipientId}
            notesToday={notesToday}
            notesTotal={stored.notes.length}
            pro={pro.pro}
            onOpenNotes={openNotes}
            onUnlock={() => setPaywallOpen(true)}
          />
        ) : (
          <SettingsScreen pro={pro} onResetData={resetAllData} />
        )}

        <View style={styles.bottomNav}>
          <NavItem icon="grid-outline" label="Today" active={tab === "today"} onPress={() => changeTab("today")} />
          <NavItem icon="people-outline" label="Circle" active={tab === "circle"} onPress={() => changeTab("circle")} />
          <NavItem
            icon="settings-outline"
            label="Settings"
            active={tab === "settings"}
            onPress={() => changeTab("settings")}
          />
        </View>

        {noticeShown ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.notice,
              {
                opacity: noticeRise,
                transform: [
                  {
                    translateY: noticeRise.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={17} color={colors.blue} />
            <Text style={styles.noticeText}>{notice}</Text>
          </Animated.View>
        ) : null}

        <AddMomentSheet
          visible={isAddingMoment}
          onClose={() => setAddingMoment(false)}
          onSubmit={addMoment}
        />

        <NotesSheet
          visible={isNotesOpen}
          recipientName={recipient.name}
          notes={recipientNotes}
          pro={pro.pro}
          notesLeftToday={notesLeftToday(stored, recipient.id)}
          onClose={() => setNotesOpen(false)}
          onSave={saveNote}
          onUnlock={() => {
            setNotesOpen(false);
            setPaywallOpen(true);
          }}
        />

        <PaywallModal
          visible={isPaywallOpen}
          onClose={() => {
            setPaywallOpen(false);
            pro.clearMessage();
          }}
          pro={pro}
        />

        {/* On the wide viewport the app is drawn inside a device frame, so it
            also gets the two hardware marks a real phone has: the Dynamic
            Island and the home indicator. Decorative only. On an actual phone
            the hardware provides both, so they render exclusively in the
            browser/desktop presentation. */}
        {isWide ? (
          <>
            <View style={styles.island} pointerEvents="none" />
            <View style={styles.homeIndicator} pointerEvents="none" />
          </>
        ) : null}
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
  viewportWide: { paddingVertical: 34, paddingHorizontal: 24, justifyContent: "center" },
  frame: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.soft,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  /** The same navy bezel the landing page draws around its phone mockups. */
  frameWide: {
    // Capped here rather than in `frame` so the app fills wider phones: a 440pt
    // device was showing a 430pt frame with a strip of backdrop down each side.
    maxWidth: 430,
    maxHeight: 932,
    borderRadius: 46,
    borderWidth: 10,
    borderColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  /**
   * The Luma pattern: nav floats free of the edges as a capsule, not a bar.
   *
   * Opaque, not frosted. Luma's bar is genuinely translucent, but it can afford
   * to be because the platform gives it a backdrop blur; `expo-blur` is a native
   * module this project deliberately does not carry, and without a blur 3%
   * translucency does not read as glass — it reads as text bleeding through the
   * bar. A solid capsule plus the shadow keeps the float without the ghosting.
   */
  bottomNav: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 10 + insets.bottom,
    minHeight: 68,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 34,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  notice: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 96 + insets.bottom,
    minHeight: 48,
    borderRadius: shape.md,
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
  /** Decorative Dynamic Island inside the desktop device frame. */
  island: {
    position: "absolute",
    top: 12,
    left: "50%",
    marginLeft: -62,
    width: 124,
    height: 32,
    borderRadius: 18,
    backgroundColor: colors.ink,
    zIndex: 60,
  },
  /** Decorative home indicator inside the desktop device frame. */
  homeIndicator: {
    position: "absolute",
    bottom: 9,
    left: "50%",
    marginLeft: -70,
    width: 140,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(24,52,104,0.9)",
    zIndex: 60,
  },
});
