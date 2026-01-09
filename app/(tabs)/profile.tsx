import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FONTS, SIZES } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type ProfileState = {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  joinDate?: string;
};

export default function ProfileScreen() {
  const { fetchProfile, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchProfileRef = useRef(fetchProfile);

  useEffect(() => {
    fetchProfileRef.current = fetchProfile;
  }, [fetchProfile]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProfileRef.current();
      if (!data) {
        setProfile(null);
        return;
      }
      setProfile({
        name: data?.name || data?.nama || data?.full_name || "User",
        email: data?.email,
        phone: data?.phone || data?.telepon || data?.no_hp,
        position: data?.position || data?.jabatan,
        department: data?.department || data?.divisi,
        joinDate: data?.join_date || data?.tanggal_gabung,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Info akun dan detail kerja.</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadProfile}>
          <Ionicons name="refresh" size={18} color="#2b2308" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Image
          source={require("../../assets/images/employee1.png")}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile?.name || "User"}
          </Text>
          <Text style={styles.profileRole}>
            {profile?.position || "Karyawan"}
          </Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color="#2b2308" />
          <Text style={styles.badgeText}>Aktif</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        {loading ? (
          <Text style={styles.helperText}>Memuat profil...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile?.email || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Telepon</Text>
              <Text style={styles.value}>{profile?.phone || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Divisi</Text>
              <Text style={styles.value}>{profile?.department || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tanggal Gabung</Text>
              <Text style={styles.value}>{profile?.joinDate || "-"}</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color="#1a1606" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: SIZES.large,
    paddingTop: SIZES.large,
    gap: SIZES.large,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: "#2b2308",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "rgba(43,35,8,0.6)",
    marginTop: 4,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: SIZES.large,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
    shadowColor: "#2b2308",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF3C2",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: "#2b2308",
  },
  profileRole: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "rgba(43,35,8,0.6)",
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#FFDE6A",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#2b2308",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: SIZES.large,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(43,35,8,0.08)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "rgba(43,35,8,0.55)",
  },
  value: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: "#2b2308",
  },
  helperText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "rgba(43,35,8,0.55)",
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "#c2483d",
  },
  logoutButton: {
    marginTop: "auto",
    marginBottom: 20,
    backgroundColor: "#1f1c2b",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#fff5cc",
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
