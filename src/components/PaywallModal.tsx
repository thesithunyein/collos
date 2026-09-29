import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { storeNote } from "../purchases/revenuecat";
import type { PlanOption } from "../purchases/revenuecat";
import type { ProController } from "../purchases/usePro";
import { colors, elevation, insets, shape } from "../theme";

/**
 * Only list what the entitlement actually unlocks, and only what is shipped.
 * Reminders were advertised here long before any notification code existed
 * (a store-review rejection, guideline 2.3.1), and invites were listed after
 * the shared circle was deferred. Both are gone: each line below is a thing a
 * person can do the moment they pay, which is why shared notes is one of them.
 */
const FEATURES = [
  "Unlimited shared notes, not one a day",
  "Every note kept in one calm place on your device",
  "Notes still there after a restart",
];

export function PaywallModal({
  visible,
  onClose,
  pro,
}: {
  visible: boolean;
  onClose: () => void;
  pro: ProController;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  // Preselect the row RevenueCat marked as highlighted, else the first plan.
  useEffect(() => {
    if (selected) return;
    const preferred = pro.plans.find((plan) => plan.highlighted) ?? pro.plans[0];
    if (preferred) setSelected(preferred.identifier);
  }, [pro.plans, selected]);

  const selectedPlan = pro.plans.find((plan) => plan.identifier === selected) ?? pro.plans[0] ?? null;
  const busy = pro.busyPlan !== null;

  const onPurchase = () => {
    if (selectedPlan) void pro.purchase(selectedPlan);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close paywall"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalIcon}>
              <Ionicons name="sparkles" size={26} color={colors.blue} />
            </View>
            <Text style={styles.modalTitle}>More room for care</Text>
            <Text style={styles.modalText}>
              Leave as many notes as your circle needs, kept on the device that needs them.
            </Text>

            <View style={styles.featureList}>
              {FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={19} color={colors.mint} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {pro.pro ? (
              <View style={styles.activeCard}>
                <Ionicons name="checkmark-circle" size={22} color={colors.mint} />
                <View style={styles.activeCopy}>
                  <Text style={styles.activeTitle}>Collos Pro is active</Text>
                  <Text style={styles.activeText}>
                    {pro.expiresAt
                      ? `Renews or expires on ${formatDate(pro.expiresAt)}.`
                      : "Thanks for supporting Collos."}
                  </Text>
                </View>
              </View>
            ) : pro.status === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.blue} />
                <Text style={styles.loadingText}>Loading plans…</Text>
              </View>
            ) : (
              <View style={styles.planList}>
                {pro.plans.map((plan) => (
                  <PlanRow
                    key={plan.identifier}
                    plan={plan}
                    selected={plan.identifier === selected}
                    disabled={busy}
                    onSelect={() => setSelected(plan.identifier)}
                  />
                ))}
              </View>
            )}

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
                  size={17}
                  color={pro.messageTone === "error" ? colors.danger : colors.blue}
                />
                <Text style={styles.messageText}>{pro.message}</Text>
              </View>
            ) : null}

            {pro.pro ? (
              <>
                {pro.managementUrl ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void Linking.openURL(pro.managementUrl!)}
                    style={styles.modalPrimaryButton}
                  >
                    <Text style={styles.modalPrimaryText}>Manage subscription</Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryLink}>
                  <Text style={styles.secondaryLinkText}>Back to your care plan</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy || !selectedPlan }}
                  disabled={busy || !selectedPlan}
                  onPress={onPurchase}
                  style={({ pressed }) => [
                    styles.modalPrimaryButton,
                    (busy || !selectedPlan) && styles.modalPrimaryButtonDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.modalPrimaryText}>
                      {selectedPlan ? `Continue with Pro · ${selectedPlan.priceString}` : "Continue with Pro"}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={pro.restoring}
                  onPress={() => void pro.restore()}
                  style={styles.secondaryLink}
                >
                  <Text style={styles.secondaryLinkText}>
                    {pro.restoring ? "Restoring…" : "Restore purchases"}
                  </Text>
                </Pressable>
              </>
            )}

            {pro.mode === "preview" ? (
              <Text style={styles.storeNote}>
                Preview mode · no payment is taken here. Prices are the live Collos plans.
              </Text>
            ) : (
              <Text style={styles.storeNote}>{storeNote()}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PlanRow({
  plan,
  selected,
  disabled,
  onSelect,
}: {
  plan: PlanOption;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      // `role="radio"` needs `aria-checked`, not `aria-selected`. React Native Web
      // 0.19 only forwards the ARIA prop, so `accessibilityState.checked` alone left
      // both plans reading as unchecked to assistive tech.
      aria-checked={selected}
      accessibilityLabel={`${plan.label}, ${plan.priceString}`}
      disabled={disabled}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.planRow,
        selected && styles.planRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.planCopy}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planLabel}>{plan.label}</Text>
          {plan.savingsPercent ? (
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE {plan.savingsPercent}%</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.planDescription}>{plan.description}</Text>
      </View>
      <View style={styles.planPriceColumn}>
        <Text style={styles.planPrice}>{plan.priceString}</Text>
        {plan.perMonthString ? <Text style={styles.planPerMonth}>{plan.perMonthString}/mo</Text> : null}
      </View>
    </Pressable>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "92%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20 + insets.bottom,
  },
  modalScroll: { paddingBottom: 14 },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blueWash,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  modalTitle: { color: colors.ink, fontSize: 23, fontWeight: "700", letterSpacing: -0.6, marginTop: 15 },
  modalText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  featureList: { gap: 13, marginTop: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  featureText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
  loadingText: { color: colors.muted, fontSize: 13 },
  planList: { gap: 10, marginTop: 22 },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.white,
    ...elevation.card,
  },
  /* The selected plan is the one card in this list that is meant to be looked
     at, so it takes the raised shadow as well as the blue edge. */
  planRowSelected: { borderColor: colors.blue, backgroundColor: colors.blueWash, ...elevation.lifted },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.blue },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.blue },
  planCopy: { flex: 1 },
  planTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  planLabel: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  saveBadge: { backgroundColor: colors.mint, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText: { color: colors.white, fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  planDescription: { color: colors.muted, fontSize: 11, marginTop: 3 },
  planPriceColumn: { alignItems: "flex-end" },
  planPrice: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  planPerMonth: { color: colors.muted, fontSize: 10, marginTop: 2 },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    padding: 11,
    borderRadius: 12,
    backgroundColor: colors.blueWash,
  },
  messageRowError: { backgroundColor: colors.errorWash },
  messageRowSuccess: { backgroundColor: colors.mintWash },
  messageText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 17 },
  modalPrimaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  modalPrimaryButtonDisabled: { backgroundColor: colors.blueDisabled },
  modalPrimaryText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 22,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.mintWash,
  },
  activeCopy: { flex: 1 },
  activeTitle: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  activeText: { color: colors.muted, fontSize: 11, marginTop: 3 },
  secondaryLink: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 6 },
  secondaryLinkText: { color: colors.blue, fontSize: 13, fontWeight: "600" },
  storeNote: { color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 10, lineHeight: 15 },
  pressed: { opacity: 0.72 },
});
