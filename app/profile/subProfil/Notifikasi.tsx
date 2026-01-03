import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, ScrollView, View, Switch } from "react-native";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomHeader from "../../../components/CustomHeader";

const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);


  return (
    <SafeAreaProvider>
      <Stack.Screen
        options={{
          headerShown: false,
          headerTitle: "Notifikasi",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#115f9f",
        }}
      />
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
          <CustomHeader title="Notifikasi" variant="accent" />
        </View>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBubble}>
                  <Ionicons name="notifications-outline" size={18} color={PALETTE.icon} />
                </View>
                <Text style={styles.rowLabel}>Terima Notifikasi</Text>
              </View>
              <Switch
                trackColor={{ false: "#d6d3c4", true: "#f6d94a" }}
                thumbColor={isEnabled ? "#b08d00" : "#f4f3f4"}
                onValueChange={toggleSwitch}
                value={isEnabled}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const PALETTE = {
  background: "#fffdf5",
  card: "#ffffff",
  border: "#efe7c4",
  accent: "#fff247",
  accentSoft: "#fff8d7",
  textPrimary: "#3a2f00",
  textMuted: "#6f5a1a",
  icon: "#b08d00",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  scrollView: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerWrap: {
    backgroundColor: PALETTE.accent,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PALETTE.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.textPrimary,
  },
});

export default App;
