import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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

type JadwalItem = {
  action?: number;
  blokabsen?: number;
  date_in?: string | null;
  date_out?: string | null;
  end_date?: string | null;
  id?: number;
  nama_lengkap?: string;
  shift?: string;
  start_date?: string | null;
};

const ACCENT = "#FFDE6A";
const ACCENT_SOFT = "#FFF7D2";
const SURFACE = "#ffffff";
const BORDER = "rgba(43,35,8,0.08)";
const SCREEN_BG = "#FBF7EF";
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

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export default function HomeScreen() {
  const { fetchNavigation, fetchProfile, fetchAbsensiJadwal } = useAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [jadwalLoading, setJadwalLoading] = useState(true);
  const [jadwalError, setJadwalError] = useState("");
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

  const loadJadwal = useCallback(async () => {
    setJadwalLoading(true);
    setJadwalError("");
    try {
      const payload = await fetchAbsensiJadwal();
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setJadwal(items);
    } catch (err) {
      setJadwalError(
        err instanceof Error ? err.message : "Gagal memuat jadwal."
      );
    } finally {
      setJadwalLoading(false);
    }
  }, [fetchAbsensiJadwal]);

  useEffect(() => {
    loadNavigation();
    loadProfile();
    loadJadwal();
  }, [loadNavigation, loadProfile, loadJadwal]);

  const profileName =
    profile?.nama_lengkap || profile?.nama || profile?.name || "User";
  const profileDepartment =
    profile?.nama_department || profile?.department || "-";
  const photoBaseUrl = "https://laskarbuah-hrd.s3.ap-southeast-3.amazonaws.com/foto_karyawan/";
  const photoUrl = profile?.foto ? `${photoBaseUrl}${profile.foto}` : null;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMenuItems = useMemo(() => {
    if (!normalizedQuery) return menuItems;
    return menuItems.filter((item) => {
      const label = item.mn_nm ?? "";
      const path = item.mn_pth ?? "";
      return `${label} ${path}`.toLowerCase().includes(normalizedQuery);
    });
  }, [menuItems, normalizedQuery]);
  const visibleMenuItems = normalizedQuery ? filteredMenuItems : menuItems;
  const upcomingJadwal = useMemo(() => {
    if (!jadwal.length) return null;
    const withDates = jadwal
      .map((item) => ({
        item,
        time: item.start_date ? new Date(item.start_date).getTime() : NaN,
      }))
      .filter((entry) => Number.isFinite(entry.time));
    if (!withDates.length) return jadwal[0] ?? null;
    const now = Date.now();
    const upcoming = withDates
      .filter((entry) => entry.time >= now)
      .sort((a, b) => a.time - b.time)[0];
    if (upcoming) return upcoming.item;
    return withDates.sort((a, b) => b.time - a.time)[0]?.item ?? jadwal[0] ?? null;
  }, [jadwal]);
  const jadwalDate = upcomingJadwal?.start_date
    ? new Date(upcomingJadwal.start_date)
    : null;
  const isJadwalToday =
    jadwalDate && !Number.isNaN(jadwalDate.getTime())
      ? isSameDay(jadwalDate, new Date())
      : false;
  const jadwalStatusLabel = isJadwalToday
    ? "Hari Ini"
    : upcomingJadwal?.blokabsen
      ? "Diblokir"
      : "Aktif";
  const jadwalStatusStyle = isJadwalToday
    ? styles.statusActive
    : upcomingJadwal?.blokabsen
      ? styles.statusBlocked
      : styles.statusActive;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.haloTop} />
      <View style={styles.haloBottom} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/profile")}
            activeOpacity={0.75}
          >
            <Image
              source={
                photoUrl
                  ? { uri: photoUrl }
                  : require("../../assets/images/employee1.png")
              }
              style={styles.avatar}
              contentFit="cover"
              transition={500}
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Selamat datang</Text>
              <Text style={styles.name}>{profileName}</Text>
              <Text style={styles.department}>{profileDepartment}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#2b2308" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryBadge}>
              <Ionicons name="sparkles-outline" size={12} color={TEXT_PRIMARY} />
              <Text style={styles.summaryBadgeText}>Ringkasan</Text>
            </View>
            <Text style={styles.summaryDate}>Hari ini</Text>
          </View>
          <Text style={styles.summaryTitle}>Aktivitas Karyawan</Text>
          <Text style={styles.summarySubtitle}>
            Pantau absensi, izin, dan riwayat tanpa berpindah layar.
          </Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>Jadwal Absensi</Text>
              {upcomingJadwal ? (
                <View style={[styles.statusBadge, jadwalStatusStyle]}>
                  <Text style={styles.statusText}>{jadwalStatusLabel}</Text>
                </View>
              ) : null}
            </View>
            {jadwalLoading ? (
              <Text style={styles.scheduleMuted}>Memuat jadwal...</Text>
            ) : jadwalError ? (
              <Text style={styles.scheduleError}>{jadwalError}</Text>
            ) : upcomingJadwal ? (
              <>
                <Text style={styles.scheduleMeta}>
                  {upcomingJadwal.shift || "Shift"} -{" "}
                  {formatDate(upcomingJadwal.start_date)}
                </Text>
                <Text style={styles.scheduleTime}>
                  {formatTime(upcomingJadwal.start_date)} -{" "}
                  {formatTime(upcomingJadwal.end_date)}
                </Text>
              </>
            ) : (
              <Text style={styles.scheduleMuted}>
                Belum ada jadwal absensi.
              </Text>
            )}
          </View>
          <View style={styles.chipRow}>
            {quickChips.map((chip) => (
              <View key={chip.label} style={styles.chip}>
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.searchCard}>
          <Ionicons name="search" size={18} color="#6f5b00" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari menu"
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={ACCENT}
          />
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => {
              if (searchQuery) {
                setSearchQuery("");
              }
            }}
          >
            <Ionicons
              name={searchQuery ? "close" : "options-outline"}
              size={16}
              color={TEXT_PRIMARY}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
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
          ) : visibleMenuItems.length ? (
            <View style={styles.menuGrid}>
              {visibleMenuItems.map((item, index) => {
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
                  </AnimatedTouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.helperText}>
              {normalizedQuery ? "Menu tidak ditemukan." : "Menu belum tersedia."}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  haloTop: {
    position: "absolute",
    top: -140,
    right: -110,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: ACCENT,
    opacity: 0.25,
  },
  haloBottom: {
    position: "absolute",
    bottom: -180,
    left: -140,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: ACCENT_SOFT,
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: SIZES.large,
    paddingBottom: 120,
    gap: 18,
  },
  header: {
    marginTop: SIZES.small,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: FONTS.medium,
  },
  name: {
    fontSize: 18,
    color: TEXT_PRIMARY,
    fontFamily: FONTS.bold,
  },
  department: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryCard: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.5)",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 10,
    color: TEXT_PRIMARY,
    fontFamily: FONTS.bold,
  },
  summaryDate: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontFamily: FONTS.medium,
  },
  summaryTitle: {
    marginTop: 12,
    fontSize: 16,
    color: TEXT_PRIMARY,
    fontFamily: FONTS.bold,
  },
  summarySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: FONTS.regular,
  },
  scheduleCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFFDF3",
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.45)",
    gap: 4,
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  scheduleMeta: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  scheduleTime: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  scheduleMuted: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  scheduleError: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#c2483d",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: ACCENT,
  },
  statusBlocked: {
    backgroundColor: "#F4E7E7",
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: TEXT_PRIMARY,
    fontFamily: FONTS.regular,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.45)",
  },
  chipText: {
    fontSize: 11,
    color: TEXT_PRIMARY,
    fontFamily: FONTS.medium,
  },
  menuSection: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
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
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.45)",
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
    gap: 10,
  },
  menuCard: {
    flexBasis: "22%",
    aspectRatio: 1,
    backgroundColor: "#FFFDF3",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  menuIconText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  menuLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
});



