import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FONTS, SIZES } from "../../constants/theme";

const quickChips = [
  { label: "Absensi Hari Ini" },
  { label: "Riwayat" },
  { label: "Pengajuan Izin" },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/employee1.png")}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Selamat datang</Text>
            <Text style={styles.name}>Jonathan Troot</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#2b2308" />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Need anything?</Text>
          <Text style={styles.heroSubtitle}>
            Pusat absensi membantu kamu check in, izin, dan lihat riwayat.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <Ionicons name="search" size={18} color="#6f5b00" />
          <Text style={styles.searchPlaceholder}>Ask anything...</Text>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={16} color="#1a1606" />
          </TouchableOpacity>
        </View>

        <View style={styles.chipRow}>
          {quickChips.map((chip) => (
            <View key={chip.label} style={styles.chip}>
              <Text style={styles.chipText}>{chip.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF9E6",
  },
  content: {
    paddingHorizontal: SIZES.large,
    paddingBottom: 120,
    gap: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: "rgba(43,35,8,0.6)",
    fontFamily: FONTS.medium,
  },
  name: {
    fontSize: 18,
    color: "#2b2308",
    fontFamily: FONTS.bold,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
  },
  hero: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  heroTitle: {
    fontSize: 22,
    color: "#2b2308",
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(43,35,8,0.55)",
    textAlign: "center",
    fontFamily: FONTS.regular,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
    shadowColor: "#2b2308",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: "rgba(43,35,8,0.5)",
    fontFamily: FONTS.regular,
  },
  micButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFDE6A",
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
  },
  chipText: {
    fontSize: 12,
    color: "#3a2f00",
    fontFamily: FONTS.medium,
  },
});
