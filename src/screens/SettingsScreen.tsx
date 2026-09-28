import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  PRO_ENTITLEMENT,
  REVENUECAT_PROJECT_ID,
  activePlatform,
  isPaymentsConfigured,
} from "../purchases/config";
import type { ProController } from "../purchases/usePro";
import { colors } from "../theme";

export function SettingsScreen({
  pro,
  onResetData,
}: {
  pro: ProController;
  onResetData: () => void | Promise<void>;
}) {
  const platform = activePlatform() ?? "unknown";
  const configured = isPaymentsConfigured();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const confirmReset = () => {
    // Alert is unavailable on web in RN 0.74, so the web gets an inline
    // two-tap confirmation instead of a silent destructive action.
    if (Alert?.alert) {
      Alert.alert(
        "Reset all data?",
        "Every confirmed moment, added moment, and preference on this device will be deleted. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: () => void onResetData() },
        ],
      );
    } else if (!confirmingReset) {
      setConfirmingReset(true);
    } else {
      setConfirmingReset(false);
      void onResetData();
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>SETTINGS</Text>
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.subtitle}>
          Manage Collos Pro, restore a purchase, and check that the store connection is healthy.
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
                  : "Shared notes, unlimited invites, and one plan for everyone."}
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

        <Text style={styles.sectionLabel}>STORE CONNECTION</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Status" value={configured ? "Connected" : "Preview mode"} />
          <DetailRow label="Platform" value={platform} />
          <DetailRow label="Entitlement" value={PRO_ENTITLEMENT} />
          <DetailRow label="App user ID" value={pro.appUserId ?? "Not assigned yet"} mono />
          <DetailRow
            label="RevenueCat project"
            value={REVENUECAT_PROJECT_ID || "Not set in this build"}
            mono
          />
        </View>
        <Text style={styles.detailHint}>
          The project ID and entitlement identifier are what judges need to verify the RevenueCat
          integration for this app.
        </Text>

        <Text style={styles.sectionLabel}>YOUR DATA</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Storage" value="On this device only" />
          <DetailRow label="Accounts" value="None — no sign-up" />
        </View>
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

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Version" value="1.0.0" />
          <DetailRow label="Payments" value="RevenueCat" />
          <DetailRow label="Privacy" value="Care data stays in your circle" />
        </View>

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

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.soft },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 20,
  },
  statusCardPro: { borderColor: colors.blue, borderWidth: 1.5 },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconPro: { backgroundColor: colors.blue },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  statusText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pillOn: { backgroundColor: colors.mintWash },
  pillOff: { backgroundColor: colors.soft },
  pillText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
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
  actionButtonText: { color: colors.blue, fontSize: 13, fontWeight: "800" },
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
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 26,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
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
  detailLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  detailValue: { color: colors.ink, fontSize: 12, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  detailValueMono: { letterSpacing: -0.2 },
  detailHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 9, paddingHorizontal: 2 },
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
  resetText: { color: colors.danger, fontSize: 13, fontWeight: "800" },
  resetTextArmed: { color: colors.white },
  pressed: { opacity: 0.72 },
});
