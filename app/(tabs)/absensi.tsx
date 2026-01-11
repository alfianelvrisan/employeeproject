import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FONTS, SIZES } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

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
const TEXT_PRIMARY = "#2b2308";
const TEXT_MUTED = "rgba(43,35,8,0.6)";
const BORDER = "rgba(43,35,8,0.08)";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export default function AbsensiScreen() {
  const { fetchAbsensiJadwal } = useAuth();
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJadwal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchAbsensiJadwal();
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setJadwal(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat jadwal.");
    } finally {
      setLoading(false);
    }
  }, [fetchAbsensiJadwal]);

  useEffect(() => {
    loadJadwal();
  }, [loadJadwal]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Absensi</Text>
            <Text style={styles.subtitle}>Jadwal dan status absensi.</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadJadwal}>
            <Ionicons name="refresh" size={18} color={TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <Text style={styles.helperText}>Memuat jadwal...</Text>
        ) : jadwal.length ? (
          jadwal.map((item, index) => {
            const statusLabel = item?.blokabsen ? "Diblokir" : "Aktif";
            const statusStyle = item?.blokabsen
              ? styles.statusBlocked
              : styles.statusActive;
            return (
              <View
                key={`${item?.id ?? "jadwal"}-${index}`}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>
                      {item?.shift || "Jadwal"}
                    </Text>
                    <Text style={styles.cardDate}>
                      {formatDate(item?.start_date)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, statusStyle]}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Jam Kerja</Text>
                  <Text style={styles.value}>
                    {formatTime(item?.start_date)} - {formatTime(item?.end_date)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Masuk</Text>
                  <Text style={styles.value}>{formatTime(item?.date_in)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Pulang</Text>
                  <Text style={styles.value}>{formatTime(item?.date_out)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Nama</Text>
                  <Text style={styles.value}>
                    {item?.nama_lengkap || "-"}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Belum ada jadwal absensi.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: SIZES.large,
    paddingBottom: 24,
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
  helperText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: SIZES.large,
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  cardDate: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
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
  statusBlocked: {
    backgroundColor: "#F4E7E7",
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
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
    color: TEXT_PRIMARY,
    textAlign: "right",
    maxWidth: "60%",
  },
});
