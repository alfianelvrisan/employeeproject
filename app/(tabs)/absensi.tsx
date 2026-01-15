import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import * as Device from "expo-device";
import { FONTS, SIZES, SHADOWS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// --- Types ---

type JadwalItem = {
  action?: number; // 1 = Normal, else = Lembur
  blokabsen?: number; // 0 = Disabled
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

// --- Utils ---

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
  if (!value) return "--:--";
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


const getFingerprint = () => {
  const parts = [
    Device.brand,
    Device.modelName,
    Device.osName,
    Device.osVersion,
    Platform.OS,
  ];
  return parts.filter(Boolean).join("::");
};

// --- Colors ---
const COLORS = {
  primary: "#2563EB",
  secondary: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  dark: "#1E293B",
  muted: "#64748B",
  light: "#F8FAFC",
  white: "#FFFFFF",
  cardBg: "#FFFFFF",
  border: "#E2E8F0",
};

export default function AbsensiScreen() {
  const { fetchAbsensiJadwal, fetchProfileJadwal, saveAbsensi, saveAbsensiLembur } = useAuth();

  // State
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [reportItems, setReportItems] = useState<JadwalReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Camera & Location State
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>("front");
  const cameraRef = useRef<CameraView>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isActiveCamera, setIsActiveCamera] = useState(false);

  // --- Data Loading ---

  const loadData = useCallback(async () => {
    try {
      const [jadwalData, reportData] = await Promise.all([
        fetchAbsensiJadwal(),
        fetchProfileJadwal()
      ]);

      const jItems = Array.isArray(jadwalData?.data) ? jadwalData.data : (Array.isArray(jadwalData) ? jadwalData : []);
      const rItems = Array.isArray(reportData?.data) ? reportData.data : (Array.isArray(reportData) ? reportData : []);

      setJadwal(jItems);
      setReportItems(rItems);
    } catch (err) {
      console.error("Failed to load absensi data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAbsensiJadwal, fetchProfileJadwal]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setIsActiveCamera(true); // Enable camera when screen is focused
      return () => {
        setIsActiveCamera(false); // Disable when blur
      };
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- Logic for Active Schedule ---

  const { activeItem, otherItems } = useMemo(() => {
    // Sort logic: Active first.
    // Active means: blokabsen=1 AND (date_in is missing OR date_out is missing)
    // Actually, based on legacy logs, user might have multiple rows.
    // The one that needs action is paramount.

    // Sort logic: 
    // 1. blokabsen == 1 && !date_out
    // 2. date (today)

    // We want to verify if there is an item that IS active and ALLOWS attendance.

    let active: JadwalItem | null = null;
    const others: JadwalItem[] = [];

    const now = new Date();

    // First, try to find an actionable item for today that hasn't completed cycle
    const actionable = jadwal.find(item =>
      item.blokabsen === 1 &&
      (item.start_date ? new Date(item.start_date).toDateString() === now.toDateString() : true)
    );

    if (actionable) {
      active = actionable;
      // Filter out this one from others
      jadwal.forEach(i => {
        if (i !== actionable) others.push(i);
      });
    } else {
      // If no actionable today, maybe just pick the first one or none
      others.push(...jadwal);
    }

    return { activeItem: active, otherItems: others };
  }, [jadwal]);

  // Init Camera/Location permissions when active item detected
  useEffect(() => {
    if (activeItem && isActiveCamera) {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation(loc);
        }
        if (!cameraPermission?.granted) {
          await requestCameraPermission();
        }
      })();
    }
  }, [activeItem, isActiveCamera, cameraPermission]);

  // --- Handlers ---

  const takePicture = async () => {
    if (cameraRef.current && !processing) {
      // Haptic or sound could be good here
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
        if (photo?.uri) {
          let finalUri = photo.uri;
          if (cameraFacing === 'front') {
            const manip = await ImageManipulator.manipulateAsync(
              photo.uri,
              [{ flip: ImageManipulator.FlipType.Horizontal }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            finalUri = manip.uri;
          }
          setCapturedImage(finalUri);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const submitAbsensi = async () => {
    if (!capturedImage || !activeItem || !location) {
      Alert.alert("Error", "Data belum lengkap (Foto/Lokasi).");
      return;
    }

    setProcessing(true);
    try {
      const mapString = `${location.coords.latitude},${location.coords.longitude}`;
      const fingerprint = getFingerprint();
      const alasan = "0";

      const isLembur = activeItem.action !== 1; // 1 = Normal

      if (!isLembur) {
        await saveAbsensi(capturedImage, activeItem.id!, mapString, alasan, fingerprint);
        Alert.alert("Sukses", "Absensi Masuk/Pulang Berhasil!", [{
          text: "OK", onPress: () => {
            setCapturedImage(null);
            loadData();
          }
        }]);
      } else {
        await saveAbsensiLembur(capturedImage, activeItem.id!, mapString, alasan, fingerprint);
        Alert.alert("Sukses", "Absensi Lembur Berhasil!", [{
          text: "OK", onPress: () => {
            setCapturedImage(null);
            loadData();
          }
        }]);
      }
    } catch (e: any) {
      Alert.alert("Gagal", e.message || "Gagal menyimpan absensi.");
    } finally {
      setProcessing(false);
    }
  };

  // --- Render Components ---

  const renderActiveCard = (item: JadwalItem) => {
    const isMasuk = !!item.date_in;
    const labelMain = isMasuk ? "Absen Pulang" : "Absen Masuk";
    const colorMain = isMasuk ? COLORS.warning : COLORS.primary;

    // Check permissions state for UI feedback
    const waitingForPerms = !cameraPermission?.granted || !location;

    return (
      <View style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <View>
            <Text style={styles.activeTitle}>{item.shift || labelMain}</Text>
            <Text style={styles.activeSubtitle}>
              {formatDate(item.start_date)} • {formatTime(item.start_date)} - {formatTime(item.end_date)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colorMain }]}>
            <Text style={styles.statusTextWhite}>{labelMain}</Text>
          </View>
        </View>

        {/* Embedded Camera View */}
        <View style={styles.cameraContainer}>
          {capturedImage ? (
            <Image source={{ uri: capturedImage }} style={styles.cameraPreview} />
          ) : (
            cameraPermission?.granted ? (
              isActiveCamera ? (
                <>
                  <CameraView
                    ref={cameraRef}
                    style={styles.cameraPreview}
                    facing={cameraFacing}
                  />
                  <View style={styles.camOverlayFrame} pointerEvents="none" />
                </>
              ) : (
                <View style={[styles.cameraPreview, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff' }}>Camera Paused</Text>
                </View>
              )
            ) : (
              <View style={styles.permissionState}>
                <Text style={styles.permText}>Izin kamera diperlukan.</Text>
                <TouchableOpacity onPress={requestCameraPermission} style={styles.permBtn}>
                  <Text style={styles.permBtnText}>Izinkan Kamera</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          {!capturedImage && cameraPermission?.granted && (
            <TouchableOpacity
              style={styles.floatingSwitch}
              onPress={() => setCameraFacing(p => p === 'front' ? 'back' : 'front')}
            >
              <Ionicons name="camera-reverse" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsArea}>
          {capturedImage ? (
            <View style={styles.rowControls}>
              <TouchableOpacity style={styles.btnSecondary} onPress={retakePicture} disabled={processing}>
                <Ionicons name="refresh" size={20} color={COLORS.primary} />
                <Text style={styles.btnTextSecondary}>Ulangi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={submitAbsensi} disabled={processing}>
                {processing ? <ActivityIndicator color="#FFF" /> : <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                <Text style={styles.btnTextPrimary}>{processing ? "Mengirim..." : `Kirim ${labelMain}`}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={takePicture}
              disabled={waitingForPerms}
              style={[
                styles.btnCaptureWrapper,
                waitingForPerms && styles.btnDisabled
              ]}
            >
              <LinearGradient
                colors={['#F59E0B', '#FDE68A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnCaptureGradient}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.captureTitle}>{labelMain}</Text>
                  <Text style={styles.captureSubtitle}>{waitingForPerms ? "Menunggu Lokasi/Izin..." : "Tap untuk ambil foto"}</Text>
                </View>
                <View style={styles.outerRing}>
                  <View style={styles.innerRing} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderInactiveCard = (item: JadwalItem, index: number) => {
    // For blocked or past schedules
    const isPulang = !!item.date_out;
    return (
      <View key={index} style={styles.inactiveCard}>
        <View style={styles.inactiveLeft}>
          <Text style={styles.inactiveShift}>{item.shift}</Text>
          <Text style={styles.inactiveDate}>{formatDate(item.start_date)}</Text>
        </View>
        <View style={styles.inactiveRight}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {isPulang ? "Selesai" : "Jadwal Lain"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryCard = (item: JadwalReportItem, index: number) => {
    const isTelat = (item.telat ?? 0) > 0;
    const isAlpa = (item.alpa ?? 0) > 0;
    const isIzin = (item.izin ?? 0) > 0;

    let statusLabel = "Hadir";
    let statusColor = COLORS.secondary; // Green
    let statusBg = "#DCFCE7";

    if (isAlpa) {
      statusLabel = "Alpa";
      statusColor = COLORS.danger;
      statusBg = "#FEE2E2";
    } else if (isIzin) {
      statusLabel = "Izin";
      statusColor = COLORS.warning;
      statusBg = "#FEF3C7";
    } else if (isTelat) {
      statusLabel = "Telat";
      statusColor = COLORS.warning;
      statusBg = "#FEF3C7";
    } else if (!item.date_in && !item.date_out) {
      // Future or no data yet
      statusLabel = "-";
      statusColor = COLORS.muted;
      statusBg = "#F1F5F9";
    }

    const dateObj = item.start_date ? new Date(item.start_date) : null;
    const dayName = dateObj ? dateObj.toLocaleDateString("id-ID", { weekday: "long" }) : "-";
    const dateStr = dateObj ? dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

    return (
      <View key={index} style={styles.historyCard}>
        <View style={styles.historyCardHeader}>
          <View>
            <Text style={styles.historyDay}>{dayName}</Text>
            <Text style={styles.historyDateFull}>{dateStr}</Text>
          </View>
          <View style={[styles.historyStatusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.historyStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.historyDivider} />

        <View style={styles.historyTimeRow}>
          <View style={styles.historyTimeCol}>
            <Text style={styles.historyLabel}>Absen Masuk</Text>
            <View style={styles.historyValueRow}>
              <Ionicons name="log-in-outline" size={16} color={COLORS.primary} />
              <Text style={styles.historyValue}>{formatTime(item.date_in)}</Text>
            </View>
          </View>
          <View style={styles.historyVerticalLine} />
          <View style={styles.historyTimeCol}>
            <Text style={styles.historyLabel}>Absen Pulang</Text>
            <View style={styles.historyValueRow}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
              <Text style={styles.historyValue}>{formatTime(item.date_out)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >


        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ margin: 20 }} />
        ) : (
          <>
            {activeItem ? (
              <>

                {renderActiveCard(activeItem)}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.secondary} />
                <Text style={styles.emptyText}>Semua jadwal hari ini selesai!</Text>
              </View>
            )}



            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Report Absensi</Text>
              <View style={styles.historyList}>
                {reportItems
                  .slice()
                  .reverse()
                  .map((item, idx) => renderHistoryCard(item, idx))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.dark
  },
  headerSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.muted
  },
  headerIconBg: {
    backgroundColor: "#DBEAFE",
    padding: 10,
    borderRadius: 50
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  // Active Card (The Camera One)
  activeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  activeTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.dark
  },
  activeSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusTextWhite: {
    fontFamily: FONTS.bold,
    color: '#FFF',
    fontSize: 12
  },

  // Camera Zone
  cameraContainer: {
    height: 380,
    backgroundColor: "#000",
    position: 'relative'
  },
  cameraPreview: {
    width: '100%',
    height: '100%'
  },
  camOverlayFrame: {
    flex: 1,
    margin: 40,
    borderWidth: 2,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    borderStyle: 'dashed'
  },
  floatingSwitch: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  permissionState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#1E293B"
  },
  permText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    marginBottom: 12
  },
  permBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  permBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold
  },

  // Controls
  controlsArea: {
    padding: 16,
    backgroundColor: COLORS.white
  },
  rowControls: {
    flexDirection: 'row',
    gap: 12
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnTextPrimary: {
    color: '#FFF',
    fontFamily: FONTS.bold,
    fontSize: 15
  },
  btnSecondary: {
    flex: 0.4,
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnTextSecondary: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 14
  },

  // Big Capture Button
  btnCaptureWrapper: {
    borderRadius: 50, // More rounded (pill shape)
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "#FCD34D", // Match gradient border
    ...SHADOWS.medium,
  },
  btnCaptureGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  btnDisabled: {
    opacity: 0.6
  },
  outerRing: {
    width: 48, // Smaller
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  innerRing: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: COLORS.white
  },
  captureTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16, // Slightly smaller
    color: "#78350F" // Dark brown text for contrast on yellow
  },
  captureSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: "#92400E" // Lighter brown
  },



  // Inactive
  inactiveCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  inactiveLeft: {
    gap: 4
  },
  inactiveShift: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.dark
  },
  inactiveDate: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.muted
  },
  inactiveRight: {},
  statusPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusPillText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.muted
  },

  // History
  historySection: {
    marginTop: 24
  },
  // History New
  historyList: {
    gap: 12
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  historyDay: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.dark
  },
  historyDateFull: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2
  },
  historyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  historyStatusText: {
    fontFamily: FONTS.bold,
    fontSize: 11
  },
  historyDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 12
  },
  historyTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historyTimeCol: {
    flex: 1,
    alignItems: 'center'
  },
  historyVerticalLine: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border
  },
  historyLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4
  },
  historyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  historyValue: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.dark
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: COLORS.white,
    borderRadius: 20
  },
  emptyText: {
    marginTop: 10,
    fontFamily: FONTS.bold,
    color: COLORS.muted
  }
});
