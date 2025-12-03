import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function CustomHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={["#4ad2ff", "rgba(74,210,255,0.2)", "rgba(8,16,26,0.95)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientShell}
        >
          <View style={styles.headerCard}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={22} color="#b7e9ff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{title}</Text>

            <TouchableOpacity onPress={() => router.push("/cart/cart")} style={styles.iconButton}>
              <Ionicons name="cart-outline" size={22} color="#b7e9ff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 1000,
  },
  gradientShell: {
    borderRadius: 18,
    padding: 2,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "rgba(8,16,26,0.95)",
    borderRadius: 16,
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(74,210,255,0.35)",
    shadowColor: "#4ad2ff",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  headerTitle: {
    fontSize: 17,
    color: "#e8f5ff",
    fontWeight: "800",
    textAlign: "center",
    flex: 1,
    textTransform: "capitalize",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74,210,255,0.35)",
    backgroundColor: "rgba(12,24,38,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
});
