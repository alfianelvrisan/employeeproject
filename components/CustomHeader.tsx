import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type HeaderProps = {
  title: string;
  variant?: "light" | "dark" | "accent";
};

export default function CustomHeader({ title, variant = "light" }: HeaderProps) {
  const router = useRouter();
  const isDark = variant === "dark";
  const isAccent = variant === "accent";

  const containerStyle: ViewStyle = [
    styles.headerContainer,
    {
      backgroundColor: isDark ? "transparent" : isAccent ? "#fff247" : "#fff",
    },
  ];
  const titleStyle: TextStyle = [
    styles.headerTitle,
    { color: isDark ? "#ffffff" : isAccent ? "#3a2f00" : "#115f9f" },
  ];
  const iconColor = isDark ? "#ffffff" : isAccent ? "#3a2f00" : "#115f9f";
  const backButtonStyle: ViewStyle = [
    styles.backButton,
    isAccent && styles.backButtonAccent,
  ];

  return (
    <>
      <StatusBar
        backgroundColor={isDark ? "transparent" : isAccent ? "#fff247" : "#fff"}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <View style={containerStyle}>
        <TouchableOpacity onPress={() => router.back()} style={backButtonStyle}>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonAccent: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#efe7c4",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});
