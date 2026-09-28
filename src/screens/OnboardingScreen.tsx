import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  onboarding: { flex: 1, backgroundColor: colors.blue, paddingHorizontal: 24 },
  onboardingTop: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 18 },
  logoMark: { width: 38, height: 38, borderRadius: 13, overflow: "hidden" },
  logoImage: { width: "100%", height: "100%" },
  wordmark: { color: colors.white, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  onboardingArt: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 280 },
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
  spark: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#90B4FF" },
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
  onboardingSubtitle: {
    color: colors.blueTint,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 14,
    maxWidth: 330,
  },
  trustNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 25 },
  trustText: { color: colors.blueTint, fontSize: 12, lineHeight: 18, flex: 1 },
  primaryButton: {
    backgroundColor: colors.white,
    minHeight: 54,
    borderRadius: 17,
    marginTop: 22,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButtonText: { color: colors.blue, fontSize: 16, fontWeight: "800" },
  onboardingFooter: { color: colors.blueMuted, fontSize: 11, textAlign: "center", marginTop: 17 },
  pressed: { opacity: 0.72 },
});
