import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Dimensions,
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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import useLocationData from "../../services/useLocationData";

export default function Index() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { userToken } = useAuth();
  const { logout } = useAuth();

  // Initialize location data once here to share between components
  const locationInstance = useLocationData(setSelectedLocation, userToken || "");

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
  const [, setUnreadCount] = useState(1);
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
        colors={[PRIMARY_YELLOW_SOFT, "#ffffff"]} // latar putih dengan nuansa kuning
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg}
      >
        <SafeAreaView style={styles.container}>
          <Animated.View style={[styles.floatingHeader, headerStyle]}>
            <View
              style={[styles.headerGradientOverlay, styles.headerGradientSolid]}
            />
            <View style={styles.headerSearchRow}>
              <View style={styles.headerSearchWrapper}>
                <LinearGradient
                  colors={["transparent", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.neonShell}
                >
                  <View style={styles.neonSearch}>
                    <Ionicons
                      name="search-outline"
                      size={16}
                      color={PRIMARY_TEXT_DARK}
                      style={styles.neonIcon}
                    />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="cari produk favoritmu"
                      placeholderTextColor={PRIMARY_TEXT_MUTED}
                      style={styles.neonInput}
                      selectionColor={PRIMARY_YELLOW}
                    />
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={[styles.neonAction]}
                      accessibilityLabel="Hapus pencarian"
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={15}
                        color={PRIMARY_TEXT_DARK}
                      />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
              <Image
                source={require("../../assets/images/update_logolbi.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
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
                  <View style={styles.heroRow}>
                    <View style={styles.heroGreeting}>
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
                    <View style={styles.heroLocation}>
                      <Location
                        onSelectStore={setSelectedLocation}
                        displayMode="location"
                        style={styles.heroLocationCard}
                        locationInstance={locationInstance}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.utilityCard}>
                  <View style={styles.utilityTopRow}>
                    <View style={styles.utilityCardHome}>
                      <Cardhome />
                    </View>
                    <View style={styles.utilityStore}>
                      <Location
                        onSelectStore={setSelectedLocation}
                        displayMode="store"
                        style={styles.storeCardCompact}
                        locationInstance={locationInstance}
                      />
                    </View>
                  </View>
                  <Image
                    source={require("../../assets/images/barindex.png")}
                    style={styles.sectionDivider}
                    resizeMode="cover"
                    accessible
                    accessibilityLabel="Pemisah antara lokasi dan daftar toko"
                  />
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const DIVIDER_RATIO = 2953 / 314;
const PRIMARY_YELLOW = "#FFF247";
const PRIMARY_YELLOW_LIGHT = "#fff27c";
const PRIMARY_YELLOW_SOFT = "#fff7cf";
const PRIMARY_TEXT_DARK = "#3a2f00";
const PRIMARY_TEXT_MUTED = "#de0866";
const PRIMARY_SHADOW = "rgba(255, 199, 0, 0.4)";

const styles = StyleSheet.create({
  greetingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ff0000ff",
    marginTop: 0,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000ff",
  },
  greetingSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#de0866",
    marginBottom: 6,
  },
  container: {
    flex: 1,
    backgroundColor: PRIMARY_YELLOW,
  },
  gradientBg: {
    flex: 1,
  },
  heroBg: {
    width: "100%",
    paddingTop: 18,
    paddingHorizontal: 13,
    paddingBottom: 10,
    backgroundColor: PRIMARY_YELLOW, // kartu ucapan kuning solid
    borderRadius: 14,
    marginHorizontal: 8,
    shadowColor: "rgba(255, 255, 255, 0.12)",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  heroGreeting: {
    flex: 1,
  },
  heroLocation: {
    flex: 1,
    justifyContent: "flex-start",
  },
  heroLocationCard: {
    marginHorizontal: 0,
    marginTop: 0,
  },

  // card home
  utilityCard: {
    width: "100%",
    marginHorizontal: 0,
    paddingVertical: 5,
    paddingHorizontal: 0,
    borderRadius: 20,
    backgroundColor: "#ffffffff",
  },

  // Card home dan lokasi
  utilityTopRow: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  utilityCardHome: {
    flex: 2,
  },
  utilityStore: {
    flex: 1,
  },
  storeCardCompact: {
    marginHorizontal: 0,
    marginTop: 0, // Removed top margin to align with Cardhome (internal margin handles it)
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
    minHeight: 100,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 10,
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    paddingTop: 50,
    paddingBottom: 0,
    paddingHorizontal: 7,
    flexDirection: "row",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
  },
  headerGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerGradientSolid: {
    backgroundColor: PRIMARY_YELLOW,
  },
  headerSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
    paddingHorizontal: 8,
  },
  headerSearchWrapper: {
    flex: 1,
    alignSelf: "center",
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  neonShell: {
    borderRadius: 30,
    padding: 2,
    backgroundColor: "transparent",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  neonSearch: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: PRIMARY_YELLOW_LIGHT,
    minHeight: 34,
  },
  neonIcon: {
    marginRight: 8,
  },
  neonInput: {
    flex: 1,
    color: "#1f1f1f",
    fontSize: 14,
    fontWeight: "500",
  },
  neonAction: {
    width: 32,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    height: 54,
  },
  bottomFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    backgroundColor: "#ffffffff",
  },
  sectionDivider: {
    width: SCREEN_WIDTH - 0,
    height: (SCREEN_WIDTH - 32) / DIVIDER_RATIO,
    alignSelf: "center",
    marginTop: 10,
  },
});
