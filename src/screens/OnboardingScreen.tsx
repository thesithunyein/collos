import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PersonFields } from "../components/PersonFields";
import { colors, elevation, shape } from "../theme";

export type NewPerson = {
  name: string;
  relationship: string;
  portraitId?: string;
  /** The person holding the phone. Optional — the app speaks neutrally without it. */
  organiserName?: string;
};

/**
 * Setup, in two steps.
 *
 * The button used to say "Set up my care circle" and its only job was to flip a
 * flag — the circle was already there, populated with two people the user had
 * never heard of, and one of their moments arrived already confirmed. The
 * promise on the button and the thing behind it are the same now: you say who
 * you are caring for, and that is whose plan you get.
 *
 * The second step is deliberately a form rather than another full-bleed hero.
 * It is the one screen where the user has something to type, so the 280px
 * illustration gives way to the card and the field stays well above the
 * keyboard.
 */
export function OnboardingScreen({
  isLoading,
  onStart,
}: {
  isLoading: boolean;
  onStart: (person: NewPerson) => void;
}) {
  const [step, setStep] = useState<"welcome" | "who">("welcome");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [portraitId, setPortraitId] = useState<string | undefined>(undefined);
  const [organiserName, setOrganiserName] = useState("");

  const canStart = name.trim().length > 0 && relationship.length > 0;

  const submit = () => {
    if (!canStart || isLoading) return;
    onStart({ name: name.trim(), relationship, portraitId, organiserName: organiserName.trim() });
  };

  return (
    <SafeAreaView style={styles.onboarding}>
      <StatusBar style="light" />
      {/* The only screen with a fixed height, so it is also the only one that
          could clip: on a short window the button fell off the bottom with no
          way to reach it. `flexGrow: 1` keeps it filling a tall frame. */}
      <ScrollView
        contentContainerStyle={styles.onboardingContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.onboardingTop}>
          <View style={styles.logoMark}>
            <Image
              source={require("../../assets/logo-mark.png")}
              style={styles.logoImage}
              accessible
              accessibilityLabel="The Collos logo: a white cat's face on a soft blue rounded square."
            />
          </View>
          <Text style={styles.wordmark}>collos</Text>
          {step === "who" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to the welcome screen"
              onPress={() => setStep("welcome")}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={18} color={colors.white} />
            </Pressable>
          ) : null}
        </View>

        {step === "welcome" ? (
          <>
            <View
              style={styles.onboardingArt}
              accessible
              accessibilityLabel="A calm blue sun illustration"
            >
              {/* Two stacked halos rather than one flat disc: a single circle read as a
                  sticker, whereas overlapping falloffs read as light behind the sun.
                  Same layered-translucency trick the hero and the launch screen use,
                  since RN has no blur without a native module. */}
              <View style={styles.sunHaloOuter} />
              <View style={styles.sunHalo} />
              <View style={styles.sun}>
                <Ionicons name="sunny" size={52} color={colors.blue} />
              </View>
              <View style={[styles.spark, styles.sparkOne]} />
              <View style={[styles.spark, styles.sparkTwo]} />
              <View style={[styles.spark, styles.sparkThree]} />
            </View>
            <View style={styles.onboardingCopy}>
              {/* Two-tone headline: the promise in white, the warm half of it in the
                  logo's own periwinkle — the landing page does the same thing. */}
              <Text style={styles.onboardingTitle}>
                Care,{"\n"}
                <Text style={styles.onboardingTitleAccent}>together.</Text>
              </Text>
              <Text style={styles.onboardingSubtitle}>
                A simple place to share the small moments that help someone feel supported.
              </Text>
              <View style={styles.trustNote}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.white} />
                <Text style={styles.trustText}>Collos is for care coordination, not medical advice.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set up my care circle"
                onPress={() => setStep("who")}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Set up my care circle</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.blue} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.whoWrap}>
            <Text style={styles.whoTitle}>Who are you caring for?</Text>
            <Text style={styles.whoSubtitle}>
              Their plan starts empty, and everything you log stays on this device.
            </Text>

            <View style={styles.formCard}>
              <PersonFields
                name={name}
                onName={setName}
                relationship={relationship}
                onRelationship={setRelationship}
                portraitId={portraitId}
                onPortrait={setPortraitId}
                onSubmitEditing={submit}
              />
            </View>

            <Text style={styles.fieldLabelDark}>And you are?</Text>
            <TextInput
              accessibilityLabel="Your name, optional"
              placeholder="e.g. Sithu (optional)"
              placeholderTextColor={colors.placeholder}
              value={organiserName}
              onChangeText={setOrganiserName}
              returnKeyType="done"
              onSubmitEditing={submit}
              maxLength={40}
              style={styles.inputDark}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start my plan"
              accessibilityState={{ disabled: !canStart }}
              onPress={submit}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.primaryButtonSpaced,
                !canStart && styles.primaryButtonOff,
                pressed && styles.pressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.blue} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Start my plan</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.blue} />
                </>
              )}
            </Pressable>
            <Text style={styles.onboardingFooter}>
              {canStart
                ? "You can change any of this later in Settings."
                : "Add a name and pick a relationship to continue."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  onboarding: { flex: 1, backgroundColor: colors.blue },
  onboardingContent: { flexGrow: 1, paddingHorizontal: 24 },
  onboardingTop: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 18 },
  logoMark: { width: 38, height: 38, borderRadius: 13, overflow: "hidden" },
  logoImage: { width: "100%", height: "100%" },
  wordmark: { color: colors.white, fontSize: 21, fontWeight: "700", letterSpacing: -0.4 },
  backButton: {
    marginLeft: "auto",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  onboardingArt: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 280 },
  sunHaloOuter: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  sunHalo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  sun: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  spark: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: colors.periwinkle },
  sparkOne: { top: "30%", left: "22%" },
  sparkTwo: { top: "21%", right: "23%", width: 8, height: 8 },
  sparkThree: { bottom: "28%", right: "20%", width: 16, height: 16, borderRadius: 8 },
  onboardingCopy: { paddingBottom: 22 },
  onboardingTitle: {
    color: colors.white,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  onboardingTitleAccent: { color: colors.periwinkle },
  onboardingSubtitle: {
    color: colors.blueTint,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 330,
  },
  trustNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24 },
  trustText: { color: colors.blueTint, fontSize: 12, lineHeight: 18, flex: 1 },
  /** Luma's primary action is a full-width pill, not a rounded rectangle. */
  primaryButton: {
    backgroundColor: colors.white,
    minHeight: 58,
    borderRadius: 999,
    marginTop: 22,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButtonText: { color: colors.blue, fontSize: 16, fontWeight: "600" },
  onboardingFooter: { color: colors.blueMuted, fontSize: 11, textAlign: "center", marginTop: 17 },
  pressed: { opacity: 0.72 },

  whoWrap: { flex: 1, justifyContent: "center", paddingTop: 8, paddingBottom: 22 },
  whoTitle: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "700",
    letterSpacing: -1,
  },
  whoSubtitle: { color: colors.blueTint, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 330 },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: shape.lg,
    padding: 18,
    marginTop: 22,
    ...elevation.card,
  },
  primaryButtonSpaced: { marginTop: 16 },
  primaryButtonOff: { opacity: 0.55 },
  /** The organiser field sits on the navy hero, so it inverts the card's inputs. */
  fieldLabelDark: { color: colors.blueTint, fontSize: 13, fontWeight: "600", marginTop: 20 },
  inputDark: {
    marginTop: 8,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
});
