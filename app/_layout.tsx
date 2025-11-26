import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "../hooks/useColorScheme";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </View>
  );
}
