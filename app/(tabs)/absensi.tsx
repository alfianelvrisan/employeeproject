import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
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

type JadwalReportItem = {
  alpa?: number;
  date_in?: string | null;
  date_out?: string | null;
  end_date?: string | null;
  izin?: number;
  loyality?: number;
  start_date?: string | null;
  telat?: number;
  work_day?: number;
  work_set?: number;
};

const ACCENT = "#FFDE6A";
const ACCENT_SOFT = "#FFF7D2";
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

const formatDateShort = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
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

export default function AbsensiScreen() {
  const { fetchAbsensiJadwal, fetchProfileJadwal, saveAbsensi } = useAuth();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>("front");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportItems, setReportItems] = useState<JadwalReportItem[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadJadwal = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
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
      if (!isRefresh) setLoading(false);
    }
  }, [fetchAbsensiJadwal]);

  const loadReport = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setReportLoading(true);
    setReportError("");
    try {
      const payload = await fetchProfileJadwal();
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setReportItems(items);
    } catch (err) {
      setReportError(
        err instanceof Error ? err.message : "Gagal memuat report jadwal."
      );
    } finally {
      if (!isRefresh) setReportLoading(false);
    }
  }, [fetchProfileJadwal]);

  useEffect(() => {
    loadJadwal();
    loadReport();
  }, [loadJadwal, loadReport]);

  const todayJadwal = useMemo(() => {
    if (!jadwal.length) return null;
    const now = new Date();
    const match = jadwal.find((item) => {
      if (!item?.start_date) return false;
      const date = new Date(item.start_date);
      if (Number.isNaN(date.getTime())) return false;
      return isSameDay(date, now);
    });
    return match ?? jadwal[0] ?? null;
  }, [jadwal]);

  const todayJadwalId = todayJadwal?.id;

  const sortedJadwal = useMemo(() => {
    if (!jadwal.length) return [];
    const now = new Date();
    return jadwal
      .map((item, index) => {
        let isToday = false;
        if (item?.start_date) {
          const date = new Date(item.start_date);
          if (!Number.isNaN(date.getTime())) {
            isToday = isSameDay(date, now);
          }
        }
        return { item, index, isToday };
      })
      .sort((left, right) => {
        if (left.isToday === right.isToday) {
          return left.index - right.index;
        }
        return left.isToday ? -1 : 1;
      })
      .map(({ item }) => item);
  }, [jadwal]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadJadwal(true), loadReport(true)]);
    setRefreshing(false);
  }, [loadJadwal, loadReport]);

  const handleToggleFacing = useCallback(() => {
    setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (!permission?.granted || capturing || !cameraRef.current) return;
    try {
      setCapturing(true);
      setSaveError("");
      setSaveSuccess("");
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        let nextUri = photo.uri;
        if (cameraFacing === "front") {
          const result = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
          );
          nextUri = result.uri;
        }
        setPhotoUri(nextUri);
      }
    } catch (err) {
      console.log("Failed to take photo", err);
    } finally {
      setCapturing(false);
    }
  }, [cameraFacing, capturing, permission?.granted]);

  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setSaveError("");
    setSaveSuccess("");
  }, []);

  const handleSave = useCallback(async () => {
    if (!photoUri) {
      setSaveError("Ambil foto dulu.");
      return;
    }
    if (!todayJadwalId) {
      setSaveError("Jadwal absensi belum tersedia.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      await saveAbsensi(photoUri, todayJadwalId);
      setSaveSuccess("Absensi berhasil disimpan.");
      setPhotoUri(null);
      await loadJadwal();
      await loadReport();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Gagal menyimpan absensi."
      );
    } finally {
      setSaving(false);
    }
  }, [photoUri, saveAbsensi, todayJadwalId, loadJadwal, loadReport]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[TEXT_PRIMARY]}
            tintColor={TEXT_PRIMARY}
          />
        }
      >

        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <View>
              <Text style={styles.cameraTitle}>Foto Absensi</Text>
              <Text style={styles.cameraSubtitle}>
                Ambil foto sebagai bukti absensi.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cameraSwitch}
              onPress={handleToggleFacing}
              disabled={!permission?.granted || Boolean(photoUri) || saving}
            >
              <Ionicons
                name="camera-reverse-outline"
                size={18}
                color={TEXT_PRIMARY}
              />
            </TouchableOpacity>
          </View>

          {!permission ? (
            <Text style={styles.helperText}>Memuat izin kamera...</Text>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>
                Izin kamera diperlukan untuk absensi foto.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>Izinkan Kamera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.cameraFrame}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.cameraPreview} />
                ) : (
                  <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFillObject}
                    facing={cameraFacing}
                  />
                )}
                {!photoUri ? (
                  <View style={styles.cameraOverlay}>
                    <View style={styles.overlayRing} />
                    <Text style={styles.overlayText}>
                      Posisikan wajah di tengah
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cameraButtons}>
                {photoUri ? (
                  <>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={handleRetake}
                      disabled={saving}
                    >
                      <Text style={styles.secondaryButtonText}>Ulangi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        saving ? styles.buttonDisabled : null,
                      ]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      <Text style={styles.primaryButtonText}>
                        {saving ? "Menyimpan..." : "Simpan Foto"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      capturing || saving ? styles.buttonDisabled : null,
                    ]}
                    onPress={handleTakePhoto}
                    disabled={capturing || saving}
                  >
                    <Ionicons name="camera" size={16} color={TEXT_PRIMARY} />
                    <Text style={styles.primaryButtonText}>
                      {capturing ? "Mengambil..." : "Ambil Foto"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {saveError ? (
                <Text style={styles.saveErrorText}>{saveError}</Text>
              ) : null}
              {saveSuccess ? (
                <Text style={styles.saveSuccessText}>{saveSuccess}</Text>
              ) : null}
            </>
          )}
        </View>

        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <Text style={styles.helperText}>Memuat jadwal...</Text>
        ) : sortedJadwal.length ? (
          sortedJadwal.map((item, index) => {
            const startDate = item?.start_date
              ? new Date(item.start_date)
              : null;
            const isToday =
              startDate && !Number.isNaN(startDate.getTime())
                ? isSameDay(startDate, new Date())
                : false;
            const absenMasuk = item?.date_in
              ? formatTime(item.date_in)
              : "Belum absen";
            const absenPulang = item?.date_out
              ? formatTime(item.date_out)
              : "Belum absen";
            const statusLabel = isToday
              ? "Hari Ini"
              : item?.blokabsen
                ? "Diblokir"
                : "Aktif";
            const statusStyle = isToday
              ? styles.statusActive
              : item?.blokabsen
                ? styles.statusBlocked
                : styles.statusActive;
            return (
              <View
                key={`${item?.id ?? "jadwal"}-${index}`}
                style={[styles.card, isToday ? styles.cardToday : null]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardTitle}>
                      {item?.shift || "Jadwal"}
                    </Text>
                    <Text style={styles.cardMetaSeparator}>-</Text>
                    <Text style={styles.cardDateInline}>
                      {formatDate(item?.start_date)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, statusStyle]}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.scheduleColumn}>
                  <View style={styles.scheduleTimeRow}>
                    <Text style={styles.scheduleTimeValue}>
                      {formatTime(item?.start_date)}
                    </Text>
                    <Text
                      style={[
                        styles.scheduleTimeValue,
                        styles.scheduleTimeValueRight,
                      ]}
                    >
                      {formatTime(item?.end_date)}
                    </Text>
                  </View>
                  <View style={styles.reportAbsenRow}>
                    <Text
                      style={[styles.reportAbsenText, styles.reportAbsenLeft]}
                    >
                      Absen Masuk: {absenMasuk}
                    </Text>
                    <Text
                      style={[styles.reportAbsenText, styles.reportAbsenRight]}
                    >
                      Absen Pulang: {absenPulang}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Belum ada jadwal absensi.</Text>
        )}

        <View style={styles.reportSection}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Report Absensi</Text>
            <TouchableOpacity
              style={styles.reportRefresh}
              onPress={() => loadReport()}
              disabled={reportLoading}
            >
              <Ionicons name="refresh" size={16} color={TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
          {reportError ? (
            <View style={styles.noticeCard}>
              <Text style={styles.errorText}>{reportError}</Text>
            </View>
          ) : null}
          {reportLoading ? (
            <Text style={styles.helperText}>Memuat report...</Text>
          ) : reportItems.length ? (
            <View style={styles.reportTable}>
              <View style={styles.reportTableHeader}>
                <Text
                  style={[
                    styles.reportTableCell,
                    styles.reportTableHead,
                    styles.reportTableDateCell,
                  ]}
                >
                  Tanggal
                </Text>
                <Text style={[styles.reportTableCell, styles.reportTableHead]}>
                  Masuk
                </Text>
                <Text style={[styles.reportTableCell, styles.reportTableHead]}>
                  Absen M
                </Text>
                <Text style={[styles.reportTableCell, styles.reportTableHead]}>
                  Pulang
                </Text>
                <Text style={[styles.reportTableCell, styles.reportTableHead]}>
                  Absen P
                </Text>
              </View>
              {reportItems.map((item, index) => {
                const absenMasuk = item.date_in
                  ? formatTime(item.date_in)
                  : "-";
                const absenPulang = item.date_out
                  ? formatTime(item.date_out)
                  : "-";
                const isLast = index === reportItems.length - 1;
                const isAlt = index % 2 === 1;
                return (
                  <View
                    key={`report-${index}`}
                    style={[
                      styles.reportTableRow,
                      isAlt ? styles.reportTableRowAlt : null,
                      isLast ? styles.reportTableRowLast : null,
                    ]}
                  >
                    <Text
                      style={[styles.reportTableCell, styles.reportTableDateCell]}
                      numberOfLines={1}
                    >
                      {formatDateShort(item.start_date)}
                    </Text>
                    <Text style={[styles.reportTableCell, styles.reportTableTime]}>
                      {formatTime(item.start_date)}
                    </Text>
                    <Text style={styles.reportTableCell}>{absenMasuk}</Text>
                    <Text style={[styles.reportTableCell, styles.reportTableTime]}>
                      {formatTime(item.end_date)}
                    </Text>
                    <Text style={styles.reportTableCell}>{absenPulang}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>Report jadwal belum tersedia.</Text>
          )}
        </View>
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
  reportSection: {
    gap: 12,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  reportRefresh: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.45)",
  },
  reportTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  reportTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF6D6",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,222,106,0.35)",
  },
  reportTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(43,35,8,0.06)",
  },
  reportTableRowAlt: {
    backgroundColor: "#FFFCF0",
  },
  reportTableRowLast: {
    borderBottomWidth: 0,
  },
  reportTableCell: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
  reportTableHead: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: TEXT_PRIMARY,
    textTransform: "uppercase",
  },
  reportTableDateCell: {
    flex: 1.2,
    textAlign: "left",
  },
  reportTableTime: {
    fontFamily: FONTS.bold,
  },
  scheduleColumn: {
    backgroundColor: "#FFFDF3",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
    gap: 8,
  },
  scheduleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  scheduleTimeValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
    textAlign: "left",
  },
  scheduleTimeValueRight: {
    textAlign: "right",
  },
  reportColumn: {
    backgroundColor: "#FFFDF3",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
    gap: 12,
  },
  reportAbsenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reportAbsenText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: TEXT_PRIMARY,
  },
  reportAbsenLeft: {
    textAlign: "left",
  },
  reportAbsenRight: {
    textAlign: "right",
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
  cardToday: {
    backgroundColor: "#FFFDF3",
    borderColor: "rgba(255,222,106,0.6)",
  },
  cameraCard: {
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
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cameraTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  cameraSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  cameraSwitch: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.5)",
  },
  permissionBox: {
    backgroundColor: ACCENT_SOFT,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.45)",
    gap: 8,
  },
  permissionText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  permissionButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: ACCENT,
  },
  permissionButtonText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  cameraFrame: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111111",
  },
  cameraPreview: {
    width: "100%",
    height: "100%",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  overlayText: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cameraButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.7)",
  },
  primaryButtonText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveErrorText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#c2483d",
    textAlign: "center",
  },
  saveSuccessText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMetaRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: TEXT_PRIMARY,
  },
  cardMetaSeparator: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  cardDateInline: {
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
});
