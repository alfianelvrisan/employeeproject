import { AuthProvider } from "../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, ScrollView, View, Image, Switch } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { fetchProfile } from "../../../services/profileServices";
import CustomHeader from "../../../components/CustomHeader";

const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);


  return (
    <AuthProvider>
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
        <SafeAreaView style={styles.container}>
          <CustomHeader title="Notification"/>
          <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.container}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="notifications-outline"
              size={20}
              style={styles.icon}
            />
            <Text style={styles.label}>Terima Notifikasi</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isEnabled ? "#115f9f" : "#f4f3f4"}
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
        </View>

          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    padding: 20,
    paddingTop: 20, // Move profile section further down
  },
  headerCard: {
    alignItems: "center",
    marginBottom: 30, // Add more space below the profile header
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#115f9f",
  },
  profileGreeting: {
    fontSize: 14,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressContainer: {
    alignItems: "flex-start", // Align items to the top for multiline text
  },
  icon: {
    color: "#115f9f",
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: "#555",
    textAlign: "right",
    flex: 2, // Allow the text to take more space
  },
  wrapText: {
    flexWrap: "wrap", // Ensure text wraps to the next line
  },
});

export default App;
