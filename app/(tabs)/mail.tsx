import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { FONTS, SIZES } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type PayrollSlip = {
  biaya_tf?: number;
  bonus?: number;
  cuti?: number;
  disiplin?: number;
  full_present?: number;
  gapok?: number;
  golongan?: string;
  grade_kpi?: string;
  izin_sakit?: number;
  lembur?: number;
  lupa_absen?: number;
  nama_lengkap?: string;
  nik?: number | string;
  periode?: string;
  potongan_lain?: number;
  potongan_tetap?: number;
  real_work?: number;
  seharusnya?: number;
  terlamabat?: number;
  total?: number;
  total_kpi?: number;
  uang_jabatan?: number;
  uang_kesehatan?: number;
  uang_makan?: number;
  uang_transport?: number;
  usr_id?: number;
  work_day?: number;
};

const ACCENT = "#FFDE6A";
const ACCENT_SOFT = "#FFF7D2";
const INK = "#2b2308";
const TEXT_MUTED = "rgba(43,35,8,0.6)";
const BORDER = "rgba(43,35,8,0.08)";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const toPeriodString = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

const parsePeriod = (value?: string) => {
  const now = new Date();
  if (!value) {
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }
  const [yearRaw, monthRaw] = value.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }
  return { year, monthIndex };
};

const formatPeriod = (value?: string) => {
  if (!value) return "-";
  const [year, month] = value.split("-");
  const monthIndex = Number(month) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return value;
  return `${MONTHS[monthIndex]} ${year}`;
};

const formatIdr = (value?: number) => {
  if (value === null || value === undefined) return "-";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "-";
  const sign = numeric < 0 ? "-" : "";
  const absValue = Math.abs(numeric);
  const formatted = Math.round(absValue)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp ${formatted}`;
};

const formatPercent = (value?: number) => {
  if (value === null || value === undefined) return "-";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "-";
  return `${numeric.toFixed(2)}%`;
};

const formatCount = (value: number | undefined, suffix: string) => {
  if (value === null || value === undefined) return "-";
  return `${value} ${suffix}`;
};

const formatDeduction = (value?: number) => {
  if (value === null || value === undefined) return "-";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "-";
  return formatIdr(-Math.abs(numeric));
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

type SlipLineProps = {
  label: string;
  value: string;
};

const SlipLine = ({ label, value }: SlipLineProps) => (
  <View style={styles.lineRow}>
    <Text style={styles.lineLabel} numberOfLines={1}>
      {label}
    </Text>
    <Text style={styles.lineValue}>{value}</Text>
  </View>
);

type InfoChipProps = {
  label: string;
  value: string;
};

const InfoChip = ({ label, value }: InfoChipProps) => (
  <View style={styles.infoChip}>
    <Text style={styles.infoChipLabel}>{label}</Text>
    <Text style={styles.infoChipValue}>{value}</Text>
  </View>
);

const MetricChip = ({ label, value }: InfoChipProps) => (
  <View style={styles.metricChip}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

export default function PayrollScreen() {
  const { fetchPayrollSlip, fetchProfile } = useAuth();
  const slipShotRef = useRef<ViewShot | null>(null);
  const [slip, setSlip] = useState<PayrollSlip | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return toPeriodString(now.getFullYear(), now.getMonth());
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());

  const pageNumber = 1;
  const rowPage = 20;
  const varWhere = "";

  const loadSlip = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPayrollSlip({
        period: selectedPeriod,
        pageNumber,
        rowPage,
        varWhere,
      });
      setSlip(Array.isArray(data) && data.length ? data[0] : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat slip gaji.");
    } finally {
      setLoading(false);
    }
  }, [fetchPayrollSlip, pageNumber, rowPage, selectedPeriod, varWhere]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data ?? null);
    } catch (err) {
      console.log("Failed to load profile", err);
    }
  }, [fetchProfile]);

  useEffect(() => {
    loadSlip();
  }, [loadSlip]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const openPeriodPicker = () => {
    const parsed = parsePeriod(selectedPeriod);
    setPickerYear(parsed.year);
    setPickerMonth(parsed.monthIndex);
    setPickerOpen(true);
  };

  const applyPeriod = () => {
    const nextPeriod = toPeriodString(pickerYear, pickerMonth);
    setSelectedPeriod(nextPeriod);
    setPickerOpen(false);
  };

  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
      if (!slipShotRef.current || !slip || loading) return;
      setExporting(true);
      setExportError("");
      try {
        const uri = await slipShotRef.current.capture?.({
          format,
          quality: 0.95,
          result: "tmpfile",
        });
        if (!uri) {
          throw new Error("Gagal membuat gambar slip.");
        }
        const available = await Sharing.isAvailableAsync();
        if (!available) {
          throw new Error("Fitur share tidak tersedia di perangkat ini.");
        }
        await Sharing.shareAsync(uri, {
          dialogTitle: "Simpan slip gaji",
          mimeType: format === "png" ? "image/png" : "image/jpeg",
        });
      } catch (err) {
        setExportError(
          err instanceof Error ? err.message : "Gagal menyimpan slip gaji."
        );
      } finally {
        setExporting(false);
      }
    },
    [loading, slip]
  );

  const periodLabel = formatPeriod(selectedPeriod);
  const slipPeriodLabel = formatPeriod(slip?.periode ?? selectedPeriod);
  const profileDivision =
    profile?.nama_divisi ||
    profile?.divisi ||
    profile?.nama_department ||
    profile?.department ||
    "-";
  const initials = getInitials(slip?.nama_lengkap);
  const workDayValue =
    slip?.real_work != null || slip?.work_day != null
      ? `${slip?.real_work ?? "-"} / ${slip?.work_day ?? "-"}`
      : "-";

  const earningsItems = useMemo(
    () => [
      { label: "Gaji Pokok", value: formatIdr(slip?.gapok) },
      { label: "Uang Jabatan", value: formatIdr(slip?.uang_jabatan) },
      { label: "Uang Kesehatan", value: formatIdr(slip?.uang_kesehatan) },
      { label: "Uang Makan", value: formatIdr(slip?.uang_makan) },
      { label: "Uang Transport", value: formatIdr(slip?.uang_transport) },
      { label: "Bonus", value: formatIdr(slip?.bonus) },
      { label: "Full Present", value: formatIdr(slip?.full_present) },
      { label: "Lembur", value: formatIdr(slip?.lembur) },
    ],
    [slip]
  );

  const deductionItems = useMemo(
    () => [
      { label: "Potongan Tetap", value: formatDeduction(slip?.potongan_tetap) },
      { label: "Potongan Lain", value: formatDeduction(slip?.potongan_lain) },
      { label: "Biaya Transfer", value: formatDeduction(slip?.biaya_tf) },
    ],
    [slip]
  );

  const attendanceItems = useMemo(
    () => [
      { label: "Cuti", value: formatCount(slip?.cuti, "hari") },
      { label: "Izin/Sakit", value: formatCount(slip?.izin_sakit, "hari") },
      { label: "Lupa Absen", value: formatCount(slip?.lupa_absen, "kali") },
      { label: "Terlambat", value: formatCount(slip?.terlamabat, "kali") },
    ],
    [slip]
  );

  const metricItems = useMemo(
    () => [
      { label: "KPI", value: formatPercent(slip?.total_kpi) },
      { label: "Disiplin", value: formatPercent(slip?.disiplin) },
      { label: "Real/Work", value: workDayValue },
    ],
    [slip, workDayValue]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.haloTop} />
      <View style={styles.haloBottom} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Payroll</Text>
            <Text style={styles.subtitle}>Slip gaji digital karyawan.</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadSlip}
            disabled={loading}
          >
            <Ionicons name="refresh" size={18} color={INK} />
          </TouchableOpacity>
        </View>

        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.periodChip} onPress={openPeriodPicker}>
            <Ionicons name="calendar" size={14} color={INK} />
            <Text style={styles.periodText}>{periodLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={INK} />
          </TouchableOpacity>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[
                styles.exportButton,
                styles.exportPrimary,
                (loading || exporting || !slip) && styles.exportDisabled,
              ]}
              onPress={() => handleExport("png")}
              disabled={loading || exporting || !slip}
            >
              <Ionicons name="download-outline" size={14} color={INK} />
              <Text style={styles.exportText}>PNG</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.exportButton,
                styles.exportGhost,
                (loading || exporting || !slip) && styles.exportDisabled,
              ]}
              onPress={() => handleExport("jpg")}
              disabled={loading || exporting || !slip}
            >
              <Ionicons name="download-outline" size={14} color={INK} />
              <Text style={styles.exportText}>JPG</Text>
            </TouchableOpacity>
          </View>
        </View>

        {exporting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={INK} />
            <Text style={styles.loadingText}>Menyiapkan file...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {exportError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.errorText}>{exportError}</Text>
          </View>
        ) : null}

        {loading && !slip ? (
          <Text style={styles.helperText}>Memuat slip gaji...</Text>
        ) : null}

        {slip && !loading ? (
          <ViewShot ref={slipShotRef} style={styles.slipCard} collapsable={false}>
            <View style={styles.slipTopBar} />
            <View style={styles.slipContent}>
              <View style={styles.slipHeader}>
                <View style={styles.brandRow}>
                  <View style={styles.brandDot} />
                  <Text style={styles.brandText} numberOfLines={1}>
                    {profileDivision}
                  </Text>
                </View>
                <View style={styles.slipMeta}>
                  <Text style={styles.slipTitle}>Slip Gaji</Text>
                  <Text style={styles.slipPeriod}>{slipPeriodLabel}</Text>
                </View>
              </View>

              <View style={styles.employeeRow}>
                <View style={styles.avatarRing}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>
                    {slip?.nama_lengkap || "Karyawan"}
                  </Text>
                  <Text style={styles.employeeMeta}>NIK: {slip?.nik ?? "-"}</Text>
                  <Text style={styles.employeeMeta} numberOfLines={1}>
                    {slip?.golongan ? `Golongan ${slip.golongan}` : "Golongan -"}
                  </Text>
                </View>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Total diterima</Text>
                  <Text style={styles.totalValue}>{formatIdr(slip?.total)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Periode</Text>
                  <Text style={styles.infoValue}>{slipPeriodLabel}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Grade KPI</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {slip?.grade_kpi || "-"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Seharusnya</Text>
                  <Text style={styles.infoValue}>{formatIdr(slip?.seharusnya)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.columnRow}>
                <View style={styles.column}>
                  <Text style={styles.columnTitle}>Pendapatan</Text>
                  {earningsItems.map((item) => (
                    <SlipLine
                      key={item.label}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </View>
                <View style={styles.column}>
                  <Text style={styles.columnTitle}>Potongan</Text>
                  {deductionItems.map((item) => (
                    <SlipLine
                      key={item.label}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Kehadiran</Text>
                <View style={styles.infoGrid}>
                  {attendanceItems.map((item) => (
                    <InfoChip
                      key={item.label}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Kinerja</Text>
                <View style={styles.metricRow}>
                  {metricItems.map((item) => (
                    <MetricChip
                      key={item.label}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.footerNote}>
                Slip ini dibuat otomatis oleh sistem.
              </Text>
            </View>
          </ViewShot>
        ) : null}

        {!loading && !slip ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Slip gaji belum tersedia.</Text>
            <Text style={styles.emptyText}>
              Silakan refresh atau pilih periode lain.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Periode</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setPickerOpen(false)}
              >
                <Ionicons name="close" size={18} color={INK} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearRow}>
              <TouchableOpacity
                style={styles.yearNav}
                onPress={() => setPickerYear((prev) => prev - 1)}
              >
                <Ionicons name="chevron-back" size={16} color={INK} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{pickerYear}</Text>
              <TouchableOpacity
                style={styles.yearNav}
                onPress={() => setPickerYear((prev) => prev + 1)}
              >
                <Ionicons name="chevron-forward" size={16} color={INK} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {MONTHS.map((label, index) => {
                const isActive = index === pickerMonth;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.monthCell,
                      isActive ? styles.monthCellActive : null,
                    ]}
                    onPress={() => setPickerMonth(index)}
                  >
                    <Text
                      style={[
                        styles.monthLabel,
                        isActive ? styles.monthLabelActive : null,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonGhost}
                onPress={() => setPickerOpen(false)}
              >
                <Text style={styles.modalButtonGhostText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={applyPeriod}
              >
                <Text style={styles.modalButtonPrimaryText}>Pakai</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FBF7EF",
  },
  haloTop: {
    position: "absolute",
    top: -160,
    right: -110,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: ACCENT,
    opacity: 0.2,
  },
  haloBottom: {
    position: "absolute",
    bottom: -180,
    left: -140,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: ACCENT_SOFT,
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: SIZES.large,
    paddingBottom: 120,
    gap: 16,
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
    color: INK,
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
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  periodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.5)",
  },
  periodText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  exportRow: {
    flexDirection: "row",
    gap: 8,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  exportPrimary: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  exportGhost: {
    backgroundColor: "#ffffff",
    borderColor: BORDER,
  },
  exportDisabled: {
    opacity: 0.55,
  },
  exportText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 10,
    borderRadius: 14,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
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
  slipCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  slipTopBar: {
    height: 8,
    backgroundColor: ACCENT,
  },
  slipContent: {
    padding: SIZES.large,
    gap: 16,
  },
  slipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ACCENT,
  },
  brandText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: INK,
  },
  slipMeta: {
    alignItems: "flex-end",
  },
  slipTitle: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  slipPeriod: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: INK,
  },
  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: INK,
  },
  employeeInfo: {
    flex: 1,
    gap: 4,
  },
  employeeName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: INK,
  },
  employeeMeta: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  totalBox: {
    backgroundColor: ACCENT_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.6)",
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: INK,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoItem: {
    flexBasis: "31%",
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
  },
  columnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  column: {
    flexBasis: "48%",
    gap: 8,
  },
  columnTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  lineLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  lineValue: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: INK,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoChip: {
    flexBasis: "48%",
    backgroundColor: "#FFFDF3",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.35)",
    gap: 4,
  },
  infoChipLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  infoChipValue: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricChip: {
    flexBasis: "30%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  metricValue: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  footerNote: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: SIZES.large,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: INK,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
    marginTop: 6,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,22,6,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: SIZES.large,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: INK,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  yearNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  yearText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: INK,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  monthCell: {
    flexBasis: "31%",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  monthCellActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  monthLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: INK,
  },
  monthLabelActive: {
    fontFamily: FONTS.bold,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButtonGhost: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#ffffff",
  },
  modalButtonGhostText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
  modalButtonPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: ACCENT,
  },
  modalButtonPrimaryText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: INK,
  },
});
