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
        <View style={styles.backgroundOverlay}>
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.headerTitle}>{title}</Text>

          {/* Cart Icon */}
          <TouchableOpacity onPress={() => router.push("/cart/cart")} style={styles.cartButton}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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
    top: 30,
    zIndex: 1000, // Ensure the header is above other content
    
  },
  backgroundOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Distribute items evenly
    backgroundColor: "rgba(31, 95, 214, 0.9)", // Biru palet utama dengan opasitas
    width: "100%", // Full width
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius:20
  },
  backButton: {
    marginLeft: 10, // Add spacing to the left
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff", // Set text color to white
    fontWeight: "bold",
    textAlign: "center", // Center the title
    flex: 1, // Allow the title to take up available space
  },
  cartButton: {
    marginRight: 10, // Add spacing to the right
  },
});
