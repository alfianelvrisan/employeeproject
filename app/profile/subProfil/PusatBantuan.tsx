import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, ScrollView, View, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import CustomHeader from "../../../components/CustomHeader";

const App = () => {
  const links = [
    {
      label: "WhatsApp",
      icon: "logo-whatsapp",
      colors: ["#25d366", "#20b85a", "#0e8c3d"],
      url: "https://wa.me/message/HFRNFSKCWDANM1",
    },
    {
      label: "Facebook",
      icon: "logo-facebook",
      colors: ["#6bb5ff", "#3b82f6", "#185adf"],
      url: "https://www.facebook.com/share/17iwTZnZst/?mibextid=wwXIfr",
    },
    {
      label: "Instagram",
      icon: "logo-instagram",
      colors: ["#ff9a9e", "#f77aae", "#c13584"],
      url: "https://www.instagram.com/laskarbuah_official?igsh=MW1rNWxuNGU5MTJqbQ%3D%3D&utm_source=qr",
    },
    {
      label: "TikTok",
      icon: "logo-tiktok",
      colors: ["#383838ff", "#2b2b2bff", "#000000ff"],
      url: "https://www.tiktok.com/@laskarbuah.official?_r=1&_t=ZS-91FKLKIttXG",
    },
    {
      label: "YouTube",
      icon: "logo-youtube",
      colors: ["#ff7b7b", "#ff4d4d", "#d10000"],
      url: "https://youtube.com/@laskarbuah",
    },
    {
      label: "Loker",
      icon: "briefcase",
      colors: ["#52c7ff", "#2f89ff", "#1f5fd6"],
      url: "https://laskarbuah.com/jobvacancy",
    },
    {
      label: "Email",
      icon: "mail",
      colors: ["#ffffff", "#e6f2ff", "#cee3ff"],
      textColor: "#0f4d92",
      url: "mailto:laskarbuah697@gmail.com",
    },
  ];

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
      <SafeAreaView style={styles.root}>
        <LinearGradient
          colors={["#d9eaff", "#b7d4ff", "#8cb7ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <CustomHeader title="Pusat Bantuan" variant="dark" />
        <ScrollView contentContainerStyle={styles.scrollView}>

          {links.map((item) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.9}
              onPress={() => Linking.openURL(item.url)}
              style={styles.cardShadow}
            >
              <LinearGradient
                colors={item.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.textColor ? item.textColor : "#ffffff"}
                    style={styles.cardIcon}
                  />
                  <Text
                    style={[
                      styles.cardLabel,
                      item.textColor ? { color: item.textColor } : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={item.textColor ? item.textColor : "#ffffff"}
                />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#eaf3ff",
  },
  scrollView: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  cardShadow: {
    marginBottom: 14,
    borderRadius: 16,
    shadowColor: "#0a3e7a",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "700",
  },
});

export default App;
