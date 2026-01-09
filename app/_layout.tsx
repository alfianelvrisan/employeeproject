import React from "react";
import { View, Text, TextInput } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "../hooks/useColorScheme";
import { AuthProvider } from "../context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { FONTS } from "../constants/theme";


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    FontIOSCustom: require("../assets/fonts/fontioscustom.otf"),
    FontIOSCustomBold: require("../assets/fonts/fontioscustombold.otf"),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      const defaultTextStyle = { fontFamily: FONTS.regular };
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = [defaultTextStyle, Text.defaultProps.style];

      TextInput.defaultProps = TextInput.defaultProps || {};
      TextInput.defaultProps.style = [defaultTextStyle, TextInput.defaultProps.style];
    }

    if (fontsLoaded || fontError) {
      // Rely on default splash behavior; no manual hide.
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <AuthProvider>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
