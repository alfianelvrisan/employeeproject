import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type HeaderProps = {
  title: string;
  variant?: "light" | "dark";
};

export default function CustomHeader({ title, variant = "light" }: HeaderProps) {
  const router = useRouter();
  const isDark = variant === "dark";

  const containerStyle: ViewStyle = [
    styles.headerContainer,
    { backgroundColor: isDark ? "transparent" : "#fff" },
  ];
  const titleStyle: TextStyle = [
    styles.headerTitle,
    { color: isDark ? "#ffffff" : "#115f9f" },
  ];
  const iconColor = isDark ? "#ffffff" : "#115f9f";

  return (
    <>
      <StatusBar backgroundColor={isDark ? "transparent" : "#fff"} barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={containerStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={titleStyle}>{title}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  backButton: {
    position: "absolute",
    left: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
