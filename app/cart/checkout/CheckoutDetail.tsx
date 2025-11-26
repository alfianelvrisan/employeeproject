import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import WebView from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";

const CheckoutDetail = () => {
  const { redirectUrl } = useLocalSearchParams() as { redirectUrl: string };
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          headerTransparent: false,
        }}
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#115f9f" />
          <Text style={styles.loadingText}>Loading Payment Page...</Text>
        </View>
      )}
      <WebView
        source={{ uri: redirectUrl || "https://your-default-payment-url.com" }}
        onLoadEnd={() => setLoading(false)}
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  webView: {
    flex: 1,
    // marginTop: 130, // Ensure the WebView starts below the header
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    // marginBottom: 100,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    marginLeft: 10,
  },
});

export default CheckoutDetail;