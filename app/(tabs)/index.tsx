import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import Produk from "../produk/produk";
import { HelloWave } from "../../components/HelloWave";
import Cardhome from "../cardHome/cardhome";
import Location from "../location/location";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile } from "../../services/profileServices";
import useScrollHeader from "../../hooks/useScrollHeader";
import { Animated, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Index() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
  // Default 1 agar badge merah muncul untuk notifikasi contoh
  const [unreadCount, setUnreadCount] = useState(1);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (userToken) {
        const profile = await fetchProfile(userToken);
        setProfile(profile);
        if (profile === undefined) {
          logout();
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

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      if (!Device.isDevice) {
        Alert.alert("Notifikasi", "Push notifikasi memerlukan perangkat fisik.");
        return;
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert("Notifikasi", "Izin notifikasi ditolak.");
        return;
      }
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        if (!projectId) {
          console.warn("Project ID untuk push token tidak ditemukan.");
          return;
        }
        await Notifications.getExpoPushTokenAsync({ projectId });
      } catch (e) {
        console.warn("Gagal mengambil push token:", e);
      }
    };

    registerForPushNotificationsAsync();

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FFBB00",
        sound: "default",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }).catch((error) =>
        console.warn("Gagal membuat channel notifikasi Android:", error)
      );
    }

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        setUnreadCount((prev) => prev + 1);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        setUnreadCount(0);
        router.push("/notification/notification");
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={["#ffffff", "#ffffff", "#ffffff"]} // latar putih solid
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg}
      >
        <SafeAreaView style={styles.container}>
          <Animated.View style={[styles.floatingHeader, headerStyle]}>
            <LinearGradient
              colors={["#ffe133", "#ffe133"]} // solid kuning tanpa gradasi
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradientOverlay}
            />
            <Image
              source={require("../../assets/images/update_logolbimobile.png")}
              style={styles.headerLogo}
            />
            <TouchableOpacity
              style={[styles.solidButton, styles.notifButton]}
              onPress={() => {
                setUnreadCount(0);
                router.push("/notification/notification");
              }}
            >
              <Ionicons name="notifications-outline" size={22} color="#1f1f1f" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
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

                <View style={styles.utilityCard}>
                  <Cardhome />
                  <Location onSelectStore={setSelectedLocation} />
                  <View style={styles.searchWrapper}>
                    <LinearGradient
                      colors={["#ffe766", "#fff7c3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.neonShell}
                    >
                      <View style={styles.neonSearch}>
                        <Ionicons
                          name="search-outline"
                          size={18}
                          color="#3a2f00"
                          style={styles.neonIcon}
                        />
                        <TextInput
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="cari produk favoritmu"
                          placeholderTextColor="#857a3a"
                          style={styles.neonInput}
                          selectionColor="#f6c700"
                        />
                        <TouchableOpacity
                          onPress={() => setSearchQuery("")}
                          style={[styles.solidButton, styles.neonAction]}
                          accessibilityLabel="Hapus pencarian"
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={16}
                            color="#2c2300"
                          />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                  <Produk
                    idStore={selectedLocation}
                    key={produkKey}
                    searchQuery={searchQuery}
                    showSearchBar={false}
                  />
                </View>
              </>
            }
            bounces={false}
            overScrollMode="never"
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
          <View pointerEvents="none" style={styles.bottomFill} />
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
    backgroundColor: "#ffe133",
  },
  gradientBg: {
    flex: 1,
  },
  heroBg: {
    width: "100%",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#ffe133", // kartu ucapan kuning solid
    borderRadius: 16,
    marginHorizontal: 12,
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  utilityCard: {
    width: "100%",
    marginTop: 10,
    marginHorizontal: 0, 
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 15,
    backgroundColor: "#ffffffff",
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 78,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    paddingTop: 26,
    paddingHorizontal: 16,
    flexDirection: "row",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
  },
  headerGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerLogo: {
    width: 100,
    height: 34,
    resizeMode: "contain",
  },
  solidButton: {
    backgroundColor: "#ffd60a",
    borderRadius: 18,
    shadowColor: "rgba(255,198,0,0.4)",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  notifButton: {
    marginLeft: "auto",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "red",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 1 }],
  },
  notifText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  searchWrapper: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 0,
    marginHorizontal: "2%",
  },
  neonShell: {
    borderRadius: 22,
    padding: 2,
    shadowColor: "rgba(255, 198, 0, 0.35)",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  neonSearch: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ffe27a",
  },
  neonIcon: {
    marginRight: 10,
  },
  neonInput: {
    flex: 1,
    color: "#1f1f1f",
    fontSize: 15,
    fontWeight: "500",
  },
  neonAction: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  // Spacer agar konten tidak tertutup header animasi
  headerSpacer: {
    height: 56,
  },
  bottomFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    backgroundColor: "#ffffff",
  },
});
