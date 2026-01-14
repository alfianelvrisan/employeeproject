import React from "react";
import { Tabs } from "expo-router";
import { Image } from "react-native";
import ProtectedRoute from "../../components/ProtectedRoute";

const tabIcons = {
  home: {
    active:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Homeact.png",
    inactive:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Homehide.png",
  },
  absensi: {
    active:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Absenact.png",
    inactive:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Absenhide.png",
  },
  quran: {
    active:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Quranact.png",
    inactive:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Quranhide.png",
  },
  mail: {
    active:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Payrollact.png",
    inactive:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Payrollhide.png",
  },
  profile: {
    active:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Profilact.png",
    inactive:
      "https://laskarbuah-marketing.s3.ap-southeast-3.amazonaws.com/Employee+Project/icon_employee/Profilhide.png",
  },
} as const;

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#1a1606",
          tabBarInactiveTintColor: "rgba(26,22,6,0.5)",
          tabBarStyle: {
            backgroundColor: "#ffffffff",
            borderTopWidth: 0,
            height: 72,
            paddingVertical: 0,
            marginHorizontal: 30,
            marginBottom: 16,
            borderRadius: 40,
            position: "absolute",
            shadowColor: "#ffdf6aff",
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.50,
            shadowRadius: 10,
            elevation: 10,
          },
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarIconStyle: {
            marginTop: 16,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={{
                  uri: focused ? tabIcons.home.active : tabIcons.home.inactive,
                }}
                style={{ width: size + 12, height: size + 12 }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="absensi"
          options={{
            title: "Absensi",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={{
                  uri: focused
                    ? tabIcons.absensi.active
                    : tabIcons.absensi.inactive,
                }}
                style={{ width: size + 12, height: size + 12 }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mail"
          options={{
            title: "Payroll",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={{
                  uri: focused ? tabIcons.mail.active : tabIcons.mail.inactive,
                }}
                style={{ width: size + 12, height: size + 12 }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quran"
          options={{
            title: "Qur'an",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={{
                  uri: focused ? tabIcons.quran.active : tabIcons.quran.inactive,
                }}
                style={{ width: size + 12, height: size + 12 }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={{
                  uri: focused
                    ? tabIcons.profile.active
                    : tabIcons.profile.inactive,
                }}
                style={{ width: size + 12, height: size + 12 }}
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
