import { AuthProvider } from "../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, ScrollView, View, Image, Touchable, TouchableOpacity } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { fetchProfile } from "../../../services/profileServices";
import CustomHeader from "../../../components/CustomHeader";


const App = () => {
  const { userToken } = useAuth();
  const [profil, setProfile] = useState<{
    nama: string;
    greeting: string;
    alamat: string;
    foto: string;
    no_tlp: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    ktp: string;
  } | null>(null);

  useEffect(() => {
    if (userToken) {
      fetchProfile(userToken)
        .then((profile) => setProfile(profile))
        .catch((error) => console.warn(error.message));
    }
  }, [userToken]);

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
          <CustomHeader title="Profiles"/>
          <ScrollView contentContainerStyle={styles.scrollView}>
            {/* Profile Header */}
            <View style={styles.headerCard}>
              <Image
                source={{
                  uri:
                    profil?.foto ||
                    "https://is3.cloudhost.id/webportallaskarbuah/webportallaskarbuah/logo/LBI%20ORI.png",
                }}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profil?.nama || "Nama Tidak Ditemukan"}
                </Text>
                <Text style={styles.profileGreeting}>
                  {profil?.greeting || "Selamat Datang!"}
                </Text>
              </View>
            </View>

            {/* Input-like Containers */}
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} style={styles.icon} />
              <Text style={styles.label}>NIK</Text>
              <Text style={styles.value}>{profil?.ktp || "-"}</Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} style={styles.icon} />
              <Text style={styles.label}>Nama</Text>
              <Text style={styles.value}>{profil?.nama || "-"}</Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} style={styles.icon} />
              <Text style={styles.label}>Telepon</Text>
              <Text style={styles.value}>{profil?.no_tlp || "-"}</Text>
            </View>
            <View style={[styles.inputContainer, styles.addressContainer]}>
              <Ionicons name="location-outline" size={20} style={styles.icon} />
              <Text style={styles.label}>Alamat</Text>
              <Text style={[styles.value, styles.wrapText]}>
                {`${profil?.provinsi || ""}, ${profil?.kabupaten || ""}, ${
                  profil?.kecamatan || ""
                }, ${profil?.alamat || "-"}`}
              </Text>
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
    paddingTop: 50, // Move profile section further down
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
  inputContainer2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#115f9f",
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
