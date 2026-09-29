import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../theme";

export function OnboardingScreen({
  isLoading,
  onStart,
}: {
  isLoading: boolean;
  onStart: () => void;
}) {
  return (
    <SafeAreaView style={styles.onboarding}>
      <StatusBar style="light" />
      {/* The only screen with a fixed height, so it is also the only one that
          could clip: on a short window the button fell off the bottom with no
          way to reach it. `flexGrow: 1` keeps it filling a tall frame. */}
      <ScrollView
        contentContainerStyle={styles.onboardingContent}
        showsVerticalScrollIndicator={false}
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
      </View>
      <View style={styles.onboardingArt} accessible accessibilityLabel="A calm blue sun illustration">
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
          onPress={onStart}
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
  wordmark: { color: colors.white, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
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
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -1.4,
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
  primaryButtonText: { color: colors.blue, fontSize: 16, fontWeight: "800" },
  onboardingFooter: { color: colors.blueMuted, fontSize: 11, textAlign: "center", marginTop: 17 },
  pressed: { opacity: 0.72 },
});
