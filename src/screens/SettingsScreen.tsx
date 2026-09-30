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
import { colors, elevation, insets, shape } from "../theme";

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
              on a device, RevenueCat Billing in the browser export. */}
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
  content: { paddingHorizontal: 20, paddingTop: 24 + insets.top, paddingBottom: 180 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "600", letterSpacing: 0.2 },
  title: { color: colors.ink, fontSize: 25, fontWeight: "700", letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: shape.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 20,
    ...elevation.card,
  },
  statusCardPro: { borderColor: colors.blue, borderWidth: 1.5 },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
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
  statusTitle: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  statusText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pillOn: { backgroundColor: colors.mintWash },
  pillOff: { backgroundColor: colors.soft },
  pillText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  pillTextOn: { color: colors.mint },
  pillTextOff: { color: colors.muted },
  statusActions: { gap: 8, marginTop: 14 },
  actionButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.blueWash,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  /** Same button, but standing on its own below a card rather than in a stack. */
  actionButtonSpaced: { marginTop: 10 },
  actionButtonText: { color: colors.blue, fontSize: 13, fontWeight: "600" },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: colors.blueWash,
  },
  messageRowError: { backgroundColor: colors.errorWash },
  messageRowSuccess: { backgroundColor: colors.mintWash },
  messageText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 17 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 26,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: shape.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    ...elevation.card,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 13,
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
  detailLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", flexShrink: 0 },
  detailValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  /** Slightly tighter so more of an identifier survives the truncation. */
  detailValueMono: { letterSpacing: -0.3, fontSize: 11 },
  detailHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 9, paddingHorizontal: 2 },
  disclosureValue: { flexDirection: "row", alignItems: "center", gap: 4 },
  disclosureText: { color: colors.blue, fontSize: 12, fontWeight: "600" },
  safetyNote: { flexDirection: "row", gap: 7, alignItems: "flex-start", marginTop: 22, paddingHorizontal: 2 },
  safetyText: { color: colors.muted, fontSize: 11, lineHeight: 17, flex: 1 },
  resetButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorWash,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  resetButtonArmed: { backgroundColor: colors.danger, borderColor: colors.danger },
  resetText: { color: colors.danger, fontSize: 13, fontWeight: "600" },
  resetTextArmed: { color: colors.white },
  pressed: { opacity: 0.72 },
});
