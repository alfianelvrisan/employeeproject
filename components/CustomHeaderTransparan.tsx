import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CustomHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    backgroundColor: "transparent", // Make the background transparent
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center content horizontally
    paddingHorizontal: 15,
    top:30
  },
  backButton: {
    position: "absolute", // Position the back button absolutely
    left: 15, // Align it to the left
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff", // Set text color to white
    fontWeight: "bold",
    textAlign: "center",
  },
});