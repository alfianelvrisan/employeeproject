import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#1a1606",
          tabBarInactiveTintColor: "rgba(26,22,6,0.5)",
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 0,
            height: 68,
            paddingBottom: 10,
            paddingTop: 8,
            marginHorizontal: 18,
            marginBottom: 16,
            borderRadius: 24,
            position: "absolute",
          },
          tabBarLabelStyle: {
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="absensi"
          options={{
            title: "Absensi",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="finger-print" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="quran"
          options={{
            title: "Qur'an",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mail"
          options={{
            title: "Mail",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="mail-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
