import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FONTS, SIZES } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type AssetItem = {
  brand?: string;
  kode_item?: string;
  name_item?: string;
  number_asset?: string;
  update_date?: string;
};

type LetterItem = {
  create_date?: string;
  id?: number;
  id_let?: number;
  name_letter?: string;
};

type ProfileState = {
  alamat?: string;
  asset_pinjam?: AssetItem[];
  flg_act?: string;
  foto?: string;
  id?: number;
  kelamin?: string;
  kompetensi?: unknown[];
  nama?: string;
  nama_department?: string;
  nama_divisi?: string;
  nama_jabatan?: string;
  nama_lengkap?: string;
  nik?: number | string;
  rekening?: string;
  surat?: LetterItem[];
  tgl_lahir?: string;
  tgl_masuk?: string;
  tlp?: string;
  email?: string;
  name?: string;
  position?: string;
  jabatan?: string;
  department?: string;
  divisi?: string;
  phone?: string;
  telepon?: string;
  no_hp?: string;
  join_date?: string;
  tanggal_gabung?: string;
};

const ACCENT = "#FFDE6A";
const ACCENT_SOFT = "#FFF7D2";
const TEXT_PRIMARY = "#2b2308";
const TEXT_MUTED = "rgba(43,35,8,0.6)";
const BORDER = "rgba(43,35,8,0.08)";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (value?: string) => {
  if (!value) return "U";
  const parts = value
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
  const letters = parts.slice(0, 2).map((item) => item[0]).join("");
  return letters ? letters.toUpperCase() : "U";
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

  const loadProfile = useCallback(async (force = false) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProfileRef.current({ force });
      setProfile(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const profileName =
    profile?.nama_lengkap || profile?.nama || profile?.name || "User";
  const profileRole =
    profile?.nama_jabatan || profile?.position || profile?.jabatan || "Karyawan";
  const profileDepartment =
    profile?.nama_department || profile?.department || "-";
  const profileDivision = profile?.nama_divisi || profile?.divisi || "-";
  const profilePhone =
    profile?.tlp || profile?.phone || profile?.telepon || profile?.no_hp || "-";
  const profileNik = profile?.nik ? String(profile.nik) : "-";
  const profileEmail = profile?.email || "-";
  const profileAddress = profile?.alamat || "-";
  const profileAccount = profile?.rekening || "-";
  const profileGender = profile?.kelamin || "-";
  const joinDate = formatDate(
    profile?.tgl_masuk || profile?.join_date || profile?.tanggal_gabung
  );
  const birthDate = formatDate(profile?.tgl_lahir);

  const assets = Array.isArray(profile?.asset_pinjam)
    ? profile?.asset_pinjam
    : [];
  const letters = Array.isArray(profile?.surat) ? profile?.surat : [];

  const statusRaw = profile?.flg_act || "";
  const isActive = statusRaw.toLowerCase().includes("active");
  const statusText = statusRaw ? (isActive ? "Aktif" : "Nonaktif") : "-";

  const photoValue = profile?.foto;
  const photoUrl =
    photoValue && photoValue.startsWith("http") ? photoValue : undefined;
  const initials = getInitials(profileName);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.accentHalo} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Profil</Text>
            <Text style={styles.subtitle}>Ringkasan data karyawan.</Text>
          </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadProfile(true)}
        >
            <Ionicons name="refresh" size={18} color={TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileName}</Text>
            <Text style={styles.profileRole}>{profileRole}</Text>
            <Text style={styles.profileDept}>{profileDepartment}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>NIK</Text>
            <Text style={styles.statValue}>{profileNik}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Divisi</Text>
            <Text style={styles.statValue}>{profileDivision}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Departemen</Text>
            <Text style={styles.statValue}>{profileDepartment}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Bergabung</Text>
            <Text style={styles.statValue}>{joinDate}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kontak & Identitas</Text>
          </View>
          {loading ? (
            <Text style={styles.helperText}>Memuat profil...</Text>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telepon</Text>
                <Text style={styles.infoValue}>{profilePhone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profileEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jenis Kelamin</Text>
                <Text style={styles.infoValue}>{profileGender}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Lahir</Text>
                <Text style={styles.infoValue}>{birthDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rekening</Text>
                <Text style={styles.infoValue}>{profileAccount}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Alamat</Text>
                <Text style={styles.infoValueBlock}>{profileAddress}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Asset Pinjam</Text>
          </View>
          {loading ? (
            <Text style={styles.helperText}>Memuat asset...</Text>
          ) : assets.length ? (
            assets.map((item, index) => (
              <View
                key={`${item?.number_asset ?? "asset"}-${index}`}
                style={styles.listItem}
              >
                <View style={styles.listAccent} />
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>
                    {item?.name_item || "Asset"}
                  </Text>
                  <Text style={styles.listMeta}>
                    {item?.brand || "-"} • {item?.kode_item || "-"}
                  </Text>
                  <Text style={styles.listMeta}>
                    No: {item?.number_asset || "-"} •{" "}
                    {formatDate(item?.update_date)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Tidak ada asset pinjam.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Surat</Text>
          </View>
          {loading ? (
            <Text style={styles.helperText}>Memuat surat...</Text>
          ) : letters.length ? (
            letters.map((item, index) => (
              <View
                key={`${item?.id ?? "surat"}-${index}`}
                style={styles.listItem}
              >
                <View style={styles.listAccent} />
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>
                    {item?.name_letter || "Surat"}
                  </Text>
                  <Text style={styles.listMeta}>
                    Tgl: {formatDate(item?.create_date)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Tidak ada surat.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={TEXT_PRIMARY} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  accentHalo: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: ACCENT,
    opacity: 0.35,
  },
  content: {
    paddingHorizontal: SIZES.large,
    paddingBottom: 28,
    gap: SIZES.large,
  },
  header: {
    marginTop: SIZES.small,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
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
    borderColor: BORDER,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  noticeCard: {
    backgroundColor: "#FFF4F1",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(194,72,61,0.2)",
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "#c2483d",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: SIZES.large,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  avatarPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  profileRole: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  profileDept: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "rgba(43,35,8,0.5)",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusActive: {
    backgroundColor: ACCENT,
  },
  statusInactive: {
    backgroundColor: "#F4E7E7",
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: ACCENT_SOFT,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.4)",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "rgba(43,35,8,0.6)",
  },
  statValue: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: SIZES.large,
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  helperText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "rgba(43,35,8,0.55)",
  },
  infoValue: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
    textAlign: "right",
    maxWidth: "60%",
  },
  infoBlock: {
    gap: 6,
  },
  infoValueBlock: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  listItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "#FFFDF3",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
  },
  listAccent: {
    width: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
    alignSelf: "stretch",
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  listMeta: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: ACCENT_SOFT,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.6)",
  },
  logoutText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
