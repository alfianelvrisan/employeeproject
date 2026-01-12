import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FONTS, SIZES } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const quickChips = [
  { label: "Absensi Hari Ini" },
  { label: "Riwayat" },
  { label: "Pengajuan Izin" },
];

type NavigationItem = {
  id_menu?: number;
  is_chd?: boolean;
  is_coll?: boolean;
  mn_nm?: string;
  mn_pth?: string;
  rk_pstn?: number;
};

const ACCENT = "#FFDE6A";
const TEXT_PRIMARY = "#2b2308";
const TEXT_MUTED = "rgba(43,35,8,0.55)";

const getMenuInitials = (value?: string) => {
  if (!value) return "M";
  const parts = value
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
  const letters = parts.slice(0, 2).map((item) => item[0]).join("");
  return letters ? letters.toUpperCase() : "M";
};

export default function HomeScreen() {
  const { fetchNavigation, fetchProfile } = useAuth();
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const fetchNavigationRef = useRef(fetchNavigation);

  useEffect(() => {
    fetchNavigationRef.current = fetchNavigation;
  }, [fetchNavigation]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch (err) {
      console.log("Failed to load profile", err);
    }
  }, [fetchProfile]);

  const loadNavigation = useCallback(async (force = false) => {
    setMenuLoading(true);
    setMenuError("");
    try {
      const data = await fetchNavigationRef.current({
        force,
        aplikasiId: 5,
      });
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : "Gagal memuat menu.");
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNavigation();
    loadProfile();
  }, [loadNavigation, loadProfile]);

  const profileName =
    profile?.nama_lengkap || profile?.nama || profile?.name || "User";
  const profileDepartment =
    profile?.nama_department || profile?.department || "-";
  const photoBaseUrl = "https://laskarbuah-hrd.s3.ap-southeast-3.amazonaws.com/foto_karyawan/";
  const photoUrl = profile?.foto ? `${photoBaseUrl}${profile.foto}` : null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image
            source={photoUrl ? { uri: photoUrl } : require("../../assets/images/employee1.png")}
            style={styles.avatar}
            contentFit="cover"
            transition={500}
          />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Selamat datang</Text>
            <Text style={styles.name}>{profileName}</Text>
            <Text style={styles.department}>{profileDepartment}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#2b2308" />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Taukah kamu Palkon?</Text>
          <Text style={styles.heroSubtitle}>
            ya betul sekali Riksi adalah palkon.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <Ionicons name="search" size={18} color="#6f5b00" />
          <Text style={styles.searchPlaceholder}>Ask anything...</Text>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={16} color="#1a1606" />
          </TouchableOpacity>
        </View>

        <View style={styles.chipRow}>
          {quickChips.map((chip) => (
            <View key={chip.label} style={styles.chip}>
              <Text style={styles.chipText}>{chip.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
          <TouchableOpacity
            style={styles.menuRefresh}
            onPress={() => loadNavigation(true)}
          >
            <Ionicons name="refresh" size={16} color={TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {menuError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.errorText}>{menuError}</Text>
          </View>
        ) : null}

        {menuLoading ? (
          <Text style={styles.helperText}>Memuat menu...</Text>
        ) : (
          <View style={styles.menuGrid}>
            {menuItems.length ? (
              menuItems.map((item, index) => {
                const label = item.mn_nm || "Menu";
                const key = item.id_menu ?? item.mn_pth ?? label ?? index;
                return (
                  <AnimatedTouchableOpacity
                    key={String(key)}
                    style={styles.menuCard}
                    entering={FadeInDown.delay(index * 50).springify().damping(12)}
                  >
                    <View style={styles.menuIcon}>
                      <Text style={styles.menuIconText}>
                        {getMenuInitials(label)}
                      </Text>
                    </View>
                    <Text style={styles.menuLabel} numberOfLines={2}>
                      {label}
                    </Text>
                    {item.mn_pth ? (
                      <Text style={styles.menuPath} numberOfLines={1}>
                        {item.mn_pth}
                      </Text>
                    ) : null}
                  </AnimatedTouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.helperText}>Menu belum tersedia.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: SIZES.large,
    paddingBottom: 120,
    gap: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: "rgba(43,35,8,0.6)",
    fontFamily: FONTS.medium,
  },
  name: {
    fontSize: 18,
    color: "#2b2308",
    fontFamily: FONTS.bold,
  },
  department: {
    fontSize: 12,
    color: "rgba(43,35,8,0.5)",
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
  },
  hero: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  heroTitle: {
    fontSize: 22,
    color: "#2b2308",
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(43,35,8,0.55)",
    textAlign: "center",
    fontFamily: FONTS.regular,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
    shadowColor: "#2b2308",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: "rgba(43,35,8,0.5)",
    fontFamily: FONTS.regular,
  },
  micButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFDE6A",
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
  },
  chipText: {
    fontSize: 12,
    color: "#3a2f00",
    fontFamily: FONTS.medium,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  menuRefresh: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
  },
  noticeCard: {
    backgroundColor: "#FFF4F1",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(194,72,61,0.2)",
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "#c2483d",
  },
  helperText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  menuCard: {
    flexBasis: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  menuIconText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  menuLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  menuPath: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: "rgba(43,35,8,0.45)",
  },
});

