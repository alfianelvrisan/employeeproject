import React, { useEffect } from "react";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PinProvider } from "../context/PinContext";


import { useFonts } from "expo-font";

function RootLayoutNav() {
  const { userToken, isAuthReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = Boolean(rootNavigationState?.key);

  const [fontsLoaded] = useFonts({
    "ArabQuran": require("../assets/fonts/ArabQuranIslamic140-vnmnZ.ttf"),
  });

  useEffect(() => {
    if (!isNavigationReady || !isAuthReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    if (!userToken && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (userToken && inAuthGroup) {
      router.replace("/");
    }
  }, [isNavigationReady, isAuthReady, userToken, segments, router]);

  if (!fontsLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PinProvider>
        <RootLayoutNav />
      </PinProvider>
    </AuthProvider>
  );
}
