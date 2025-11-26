import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import Produk from "../produk/produk";
import { HelloWave } from "../../components/HelloWave";
import Cardhome from "../cardHome/cardhome";
import Location from "../location/location";
import React, { useEffect, useState } from "react";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile } from "../../services/profileServices";
import useScrollHeader from "../../hooks/useScrollHeader";
import { Animated } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const { userToken } = useAuth();
  const { logout } = useAuth();
  const [profil, setProfile] = React.useState<{
    nama: string;
    saving: number;
    poin: number;
    ranking: number;
    total: number;
    greeting: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [produkKey, setProdukKey] = useState(0); // Key to force re-render Produk
  const { headerStyle, handleScroll } = useScrollHeader();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (userToken) {
        const profile = await fetchProfile(userToken);
        setProfile(profile);
        if(profile===undefined){
          logout()
        }
        setProdukKey((prevKey) => prevKey + 1); // Update Produk key to refresh it
      }
    } catch (error) {
      console.warn((error as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchProfile(userToken)
        .then((profile) => setProfile(profile))
        .catch((error) => console.warn(error.message));
    }
  }, [userToken]);

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={["#cde7ff", "#e6f3ff", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
        style={styles.gradientBg}
      >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.floatingHeader, headerStyle]}>
          <Image
            source={require("../../assets/images/update_logolbimobile.png")}
            style={styles.headerLogo}
          />
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push("/notification/notification")}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifText}>13</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        <FlatList
          data={[]}
          keyExtractor={() => `${userToken}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => null}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          ListHeaderComponent={
            <>
              <View style={styles.headerSpacer} />
              <View style={styles.heroBg}>
                <View style={styles.section}>
                  <Text style={styles.greetingTitle}>
                    {profil?.greeting || "Good morning"},
                  </Text>
                  <View style={styles.greetingRow}>
                    <Text style={styles.greetingName}>
                      {profil?.nama || "Sobat Laskar Buah"}
                    </Text>
                    <HelloWave />
                  </View>
                  <Text style={styles.greetingSubtitle}>
                    Semoga harimu menyenangkan dan penuh energi.
                  </Text>
                </View>
              </View>

              <Cardhome />
              <Location onSelectStore={setSelectedLocation} />
              <Produk idStore={selectedLocation} key={produkKey} /> 
            </>
          }
          bounces={false}
          overScrollMode="never"
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  greetingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#d7263d",
    marginTop: 0,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  greetingName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#115f9f",
  },
  greetingSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#4a6078",
    marginBottom: 6,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  gradientBg: {
    flex: 1,
  },
  heroBg: {
    width: "100%",
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "rgba(17,95,159,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    paddingTop: 26,
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  headerLogo: {
    width: 100,
    height: 34,
    resizeMode: "contain",
  },
  notifButton: {
    marginLeft: "auto",
    padding: 6,
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notifText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  searchWrapper: {
    marginTop: 10,
    marginBottom: 10,
  },
  // Spacer agar konten tidak tertutup header animasi
  headerSpacer: {
    height: 56,
  },
});
