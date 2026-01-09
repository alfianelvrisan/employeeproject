import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONTS } from "../../constants/theme";

export default function QuranScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <Text style={styles.title}>Qur'an</Text>
        <Text style={styles.subtitle}>Halaman Qur'an akan dibuat di sini.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF9E6",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: "#2b2308",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "rgba(43,35,8,0.6)",
  },
});
