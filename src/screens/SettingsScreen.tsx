import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { deviceRows } from "../platform/device";
import {
  PRO_ENTITLEMENT,
  REVENUECAT_PROJECT_ID,
  isPaymentsConfigured,
  storeDisplayName,
} from "../purchases/config";
import type { ProController } from "../purchases/usePro";
import { colors, elevation, insets, shape, space, type } from "../theme";

/**
 * The live figures for the "Your data" card.
 *
 * They are passed in rather than read here because they all come from stored
 * state, which only `App` owns. Nothing on the card is a written label: every
 * value is a count of what this device is holding at the moment it is drawn.
 */
export type SettingsData = {
  /** People in the care circle. */
  people: number;
  /** Moments on the active person's plan. */
  moments: number;
  /** Of those, how many are confirmed today. */
  confirmed: number;
  /** Notes saved for the active person. */
  notes: number;
  /** Size of the stored payload, in bytes. */
  bytes: number;
};

export function SettingsScreen({
  pro,
  onResetData,
  onResetDay,
  data,
}: {
  pro: ProController;
  onResetData: () => void | Promise<void>;
  /** Clears today's confirmations. Moved here from Today, where it sat as a
   *  peer of Add — a device-state control next to the one button people press. */
  onResetDay: () => void;
  data: SettingsData;
}) {
  const configured = isPaymentsConfigured();
  const [confirmingReset, setConfirmingReset] = useState(false);
  // The identifiers are real, but they are support-badge material, not settings.
  // They live behind a tap so the card opens on two rows a person can read.
  const [showSupport, setShowSupport] = useState(false);

  const confirmReset = () => {
    // A native Alert dialog on iOS/Android; an inline two-tap arm-and-confirm
    // on web. The branch is on `Platform.OS` rather than on `Alert?.alert`
    // truthiness: react-native-web ships `Alert` as a no-op stub whose `alert`
    // *exists*, so the old guard passed on web and the reset button did
    // nothing at all — a silent no-op on the most destructive control in the
    // app, found in an end-to-end audit of the production build.
    if (Platform.OS === "web") {
      if (!confirmingReset) {
        setConfirmingReset(true);
      } else {
        setConfirmingReset(false);
        void onResetData();
      }
      return;
    }
    Alert.alert(
      "Reset all data?",
      "Every confirmed moment, added moment, and preference on this device will be deleted. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => void onResetData() },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.subtitle}>
          Your Collos Pro plan, what this device is holding, and the connection behind your
          purchase.
        </Text>

        <View style={[styles.statusCard, pro.pro ? styles.statusCardPro : null]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, pro.pro && styles.statusIconPro]}>
              <Ionicons
                name={pro.pro ? "sparkles" : "sparkles-outline"}
                size={18}
                color={pro.pro ? colors.white : colors.blue}
              />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>
                {pro.pro ? "Collos Pro is active" : "Collos Pro"}
              </Text>
              <Text style={styles.statusText}>
                {pro.pro
                  ? pro.expiresAt
                    ? `Current period ends ${formatDate(pro.expiresAt)}.`
                    : "You have access to every Pro feature."
                  : "One shared note a day. Pro keeps as many as your circle needs."}
              </Text>
            </View>
            <View style={[styles.pill, pro.pro ? styles.pillOn : styles.pillOff]}>
              <Text style={[styles.pillText, pro.pro ? styles.pillTextOn : styles.pillTextOff]}>
                {pro.pro ? "ACTIVE" : "FREE"}
              </Text>
            </View>
          </View>

          <View style={styles.statusActions}>
            {pro.managementUrl ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void Linking.openURL(pro.managementUrl!)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              >
                <Ionicons name="card-outline" size={16} color={colors.blue} />
                <Text style={styles.actionButtonText}>Manage subscription</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={pro.restoring}
              onPress={() => void pro.restore()}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              {pro.restoring ? (
                <ActivityIndicator size="small" color={colors.blue} />
              ) : (
                <Ionicons name="refresh" size={16} color={colors.blue} />
              )}
              <Text style={styles.actionButtonText}>
                {pro.restoring ? "Restoring…" : "Restore purchases"}
              </Text>
            </Pressable>
          </View>

          {pro.message ? (
            <View
              accessibilityLiveRegion="polite"
              style={[
                styles.messageRow,
                pro.messageTone === "error" && styles.messageRowError,
                pro.messageTone === "success" && styles.messageRowSuccess,
              ]}
            >
              <Ionicons
                name={pro.messageTone === "error" ? "alert-circle" : "information-circle"}
                size={16}
                color={pro.messageTone === "error" ? colors.danger : colors.blue}
              />
              <Text style={styles.messageText}>{pro.message}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Store connection</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Status" value={configured ? "Connected" : "Preview mode"} />
          {/* Who bills the card if Pro is bought here: App Store and Google Play
              on a device, RevenueCat Billing in the browser export — or the Test
              Store, when the build carries a `test_` key. */}
          <DetailRow label="Billing" value={storeDisplayName()} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showSupport }}
            accessibilityLabel={
              showSupport ? "Hide support details" : "Show support details"
            }
            onPress={() => setShowSupport((open) => !open)}
            style={({ pressed }) => [styles.detailRow, pressed && styles.pressed]}
          >
            <Text style={styles.detailLabel}>Support details</Text>
            <View style={styles.disclosureValue}>
              <Text style={styles.disclosureText}>{showSupport ? "Hide" : "Show"}</Text>
              <Ionicons
                name={showSupport ? "chevron-up" : "chevron-down"}
                size={15}
                color={colors.blue}
              />
            </View>
          </Pressable>
          {showSupport ? (
            <>
              <DetailRow label="Entitlement" value={PRO_ENTITLEMENT} mono />
              <DetailRow label="App user ID" value={pro.appUserId ?? "Not assigned yet"} mono />
              <DetailRow
                label="RevenueCat project"
                value={REVENUECAT_PROJECT_ID || "Not set in this build"}
                mono
              />
            </>
          ) : null}
        </View>
        <Text style={styles.detailHint}>
          Pro is unlocked by an entitlement checked against RevenueCat every time the app opens. If
          a purchase ever goes missing, restore it from the card at the top; the support details are
          the identifiers to quote if that does not work.
        </Text>

        <Text style={styles.sectionLabel}>Your data</Text>
        <View style={styles.detailCard}>
          <DetailRow label="People" value={countLabel(data.people, "person", "people")} />
          {/* "On today's plan", not "This plan": a moment set to weekdays or
              weekends is on the plan every day but only *appears* on some, and
              these two rows have to agree with each other and with the Today
              screen. */}
          <DetailRow
            label="On today’s plan"
            value={countLabel(data.moments, "moment", "moments")}
          />
          <DetailRow
            label="Confirmed today"
            value={data.moments === 0 ? "Nothing planned" : `${data.confirmed} of ${data.moments}`}
          />
          <DetailRow label="Notes" value={data.notes === 1 ? "1 saved" : `${data.notes} saved`} />
          {/* The pixel figure is the real payload the store writes, not an estimate. */}
          <DetailRow label="Storage" value={`${formatBytes(data.bytes)} on this device`} />
        </View>
        <Text style={styles.detailHint}>
          These are the figures this device is holding right now. There is no account and no server
          copy — the care data on this screen is the whole of it, and Reset all data removes it.
        </Text>
        {/*
         * Both resets live here, one above the other, because both are
         * device-state operations and the difference between them is only
         * visible side by side: this one is reversible and reads as a normal
         * action, the one below deletes and reads as a warning. On Today the
         * reversible one sat as a peer of *Add* instead — a control that wipes
         * the day, one slip away from the button people actually press.
         */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset today's moments to not confirmed"
          onPress={onResetDay}
          style={({ pressed }) => [styles.actionButton, styles.actionButtonSpaced, pressed && styles.pressed]}
        >
          <Ionicons name="refresh" size={16} color={colors.blue} />
          <Text style={styles.actionButtonText}>Reset today's plan</Text>
        </Pressable>
        <Text style={styles.detailHint}>
          Clears today's confirmations and skips so the day can be run again. Nothing is deleted —
          the moments, the notes and your preferences all stay.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={confirmingReset ? "Tap again to confirm reset" : "Reset all app data"}
          onPress={confirmReset}
          style={({ pressed }) => [
            styles.resetButton,
            confirmingReset && styles.resetButtonArmed,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={confirmingReset ? "alert-circle" : "trash-outline"}
            size={16}
            color={confirmingReset ? colors.white : colors.danger}
          />
          <Text style={[styles.resetText, confirmingReset && styles.resetTextArmed]}>
            {confirmingReset ? "Tap again to permanently reset" : "Reset all data on this device"}
          </Text>
        </Pressable>
        <Text style={styles.detailHint}>
          Resetting clears confirmed moments, added moments, and preferences from this device. Your
          purchase is untouched — Restore purchases brings Pro back.
        </Text>

        <Text style={styles.sectionLabel}>This device</Text>
        <View style={styles.detailCard}>
          {deviceRows().map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} mono={row.mono} />
          ))}
        </View>
        <Text style={styles.detailHint}>
          Platform, OS version and runtime are read from the app you are holding, not written into
          the copy. On a phone this card reads iOS or Android and “Native”; in a browser it reads
          Web export — same codebase, second target.
        </Text>

        <View style={styles.safetyNote}>
          <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
          <Text style={styles.safetyText}>
            Collos helps coordinate care. It does not provide medical advice or replace a care
            professional. In an emergency, contact local emergency services.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, mono && styles.detailValueMono]}
        numberOfLines={1}
        accessibilityLabel={`${label}: ${value}`}
      >
        {value}
      </Text>
    </View>
  );
}

/** `1 person` / `3 people`, so no row ever reads `1 people`. */
function countLabel(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** `812 B` / `1.4 KB` — how a file manager reports the same number. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.soft },
  content: {
    paddingHorizontal: space.xxxl,
    paddingTop: space.huge + insets.top,
    paddingBottom: 180,
  },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.display, color: colors.ink, marginTop: space.xs },
  subtitle: { ...type.callout, color: colors.muted, marginTop: space.sm },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: shape.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xxl,
    marginTop: space.xxxl,
    ...elevation.card,
  },
  statusCardPro: { borderColor: colors.blue, borderWidth: 1.5 },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: space.lg },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconPro: { backgroundColor: colors.blue },
  statusCopy: { flex: 1 },
  statusTitle: { ...type.subhead, color: colors.ink },
  statusText: { ...type.caption, color: colors.muted, marginTop: 3 },
  /** The same pill shape every status in the app wears — see `CircleScreen`. */
  pill: { borderRadius: 9, paddingHorizontal: space.sm, paddingVertical: space.xxs },
  pillOn: { backgroundColor: colors.mintWash },
  pillOff: { backgroundColor: colors.soft },
  pillText: { ...type.tag, letterSpacing: 0.5 },
  pillTextOn: { color: colors.mint },
  pillTextOff: { color: colors.muted },
  statusActions: { gap: space.sm, marginTop: space.xl },
  actionButton: {
    minHeight: 46,
    borderRadius: shape.sm,
    backgroundColor: colors.blueWash,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  /** Same button, but standing on its own below a card rather than in a stack. */
  actionButtonSpaced: { marginTop: space.md },
  actionButtonText: { ...type.callout, fontWeight: "600", color: colors.blue },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: shape.sm,
    backgroundColor: colors.blueWash,
  },
  messageRowError: { backgroundColor: colors.errorWash },
  messageRowSuccess: { backgroundColor: colors.mintWash },
  messageText: { ...type.caption, flex: 1, color: colors.ink },
  sectionLabel: {
    ...type.micro,
    color: colors.muted,
    marginTop: space.huge,
    marginBottom: space.md,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: shape.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.xl,
    ...elevation.card,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  /**
   * `flexShrink: 0` keeps the label on one line.
   *
   * The store table is the one place with a genuinely long value — the
   * RevenueCat anonymous app user ID runs past 60 characters — and without a
   * fixed label the row split it as "App user" / "ID" while the value ran into
   * the card edge. Now the label holds its width and the value takes what is
   * left, so `numberOfLines={1}` has a real width to ellipsize against instead
   * of overflowing.
   */
  detailLabel: { ...type.caption, fontWeight: "700", color: colors.muted, flexShrink: 0 },
  detailValue: {
    ...type.caption,
    fontWeight: "700",
    color: colors.ink,
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  /** Slightly tighter so more of an identifier survives the truncation. */
  detailValueMono: { fontSize: 11, letterSpacing: -0.3 },
  detailHint: {
    ...type.caption,
    color: colors.muted,
    marginTop: space.md,
    paddingHorizontal: 2,
  },
  disclosureValue: { flexDirection: "row", alignItems: "center", gap: space.xxs },
  disclosureText: { ...type.caption, fontWeight: "600", color: colors.blue },
  safetyNote: {
    flexDirection: "row",
    gap: space.xs,
    alignItems: "flex-start",
    marginTop: space.xxxl,
    paddingHorizontal: 2,
  },
  safetyText: { ...type.caption, color: colors.muted, flex: 1 },
  resetButton: {
    minHeight: 48,
    borderRadius: shape.sm,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorWash,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.md,
  },
  resetButtonArmed: { backgroundColor: colors.danger, borderColor: colors.danger },
  resetText: { ...type.callout, fontWeight: "600", color: colors.danger },
  resetTextArmed: { color: colors.white },
  pressed: { opacity: 0.72 },
});
