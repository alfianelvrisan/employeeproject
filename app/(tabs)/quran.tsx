import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Sharing from "expo-sharing";
import { FONTS, SIZES } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type Surah = {
  id?: number;
  name?: string;
  translation?: string;
  transliteration?: string;
};

type Ayat = {
  ayahtext?: string;
  baris?: number;
  id?: number;
  indotext?: string;
  suraid?: number;
  verseid?: number;
};

type PlaybackState = {
  positionMillis: number;
  durationMillis: number;
  isPlaying: boolean;
};

const EMERALD = "#0F3D2E";
const EMERALD_SOFT = "#E6F2EC";
const GOLD = "#D7B566";
const SAND = "#FBF7EF";
const INK = "#1F2B24";
const TEXT_MUTED = "rgba(31,43,36,0.62)";
const BORDER = "rgba(15,61,46,0.12)";

const getAyatKey = (item: Ayat, index: number) =>
  String(item.id ?? item.verseid ?? index);

const getAyatMeta = (item: Ayat) => {
  const parts = [];
  if (item.suraid) parts.push(`Surah ${item.suraid}`);
  if (item.verseid) parts.push(`Ayat ${item.verseid}`);
  if (item.baris) parts.push(`Baris ${item.baris}`);
  return parts.join(" | ") || "-";
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatTime = (valueMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${pad2(seconds)}`;
};

const formatTimestamp = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}:${pad2(date.getSeconds())}`;
};

const buildFilename = (sessionLabel: string, date: Date) => {
  const normalized = sessionLabel.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const stamp = `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}${date.getFullYear()}${pad2(
    date.getHours()
  )}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  return `ABS${normalized}${stamp}`;
};

export default function QuranScreen() {
  const {
    fetchQuran,
    startQuranSession,
    saveQuranAttendance,
    clearQuranAttendance,
  } = useAuth();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackState>({
    positionMillis: 0,
    durationMillis: 0,
    isPlaying: false,
  });
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "paused" | "stopped"
  >("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState("");
  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayatList, setAyatList] = useState<Ayat[]>([]);
  const [selectedAyatKey, setSelectedAyatKey] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const sessionNumber = 1;
  const sessionLabel = "Subuh";

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => undefined);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, [sound]);

  const loadQuran = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchQuran();
      const surahData = Array.isArray(payload?.surah) ? payload?.surah : [];
      const ayatData = Array.isArray(payload?.ayat) ? payload?.ayat : [];
      setSurah(surahData.length ? surahData[0] : null);
      setAyatList(ayatData);
      setSelectedAyatKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data Quran.");
    } finally {
      setLoading(false);
    }
  }, [fetchQuran]);

  useEffect(() => {
    loadQuran();
  }, [loadQuran]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;
    setPlaybackStatus({
      positionMillis: status.positionMillis ?? 0,
      durationMillis: status.durationMillis ?? 0,
      isPlaying: Boolean(status.isPlaying),
    });
  }, []);

  const resetRecording = useCallback(async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // ignore cleanup errors
      }
      recordingRef.current = null;
    }
    if (sound) {
      await sound.unloadAsync().catch(() => undefined);
      setSound(null);
    }
    setRecordingState("idle");
    setRecordingDuration(0);
    setRecordingUri(null);
    setPlaybackStatus({ positionMillis: 0, durationMillis: 0, isPlaying: false });
    setRecordingError("");
  }, [sound]);

  const startRecording = useCallback(async () => {
    setRecordingError("");
    if (!sessionStarted) {
      setActionError("Mulai sesi terlebih dahulu.");
      return;
    }
    if (recordingState === "recording") return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        setRecordingError("Izin mikrofon ditolak.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      if (sound) {
        await sound.unloadAsync().catch(() => undefined);
        setSound(null);
      }
      if (recordingState !== "paused") {
        setRecordingDuration(0);
        setRecordingUri(null);
        setPlaybackStatus({
          positionMillis: 0,
          durationMillis: 0,
          isPlaying: false,
        });
      }
      if (!recordingRef.current) {
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recording.setOnRecordingStatusUpdate((status) => {
          if (status.isRecording && typeof status.durationMillis === "number") {
            setRecordingDuration(status.durationMillis);
          }
        });
        recordingRef.current = recording;
      }
      await recordingRef.current.startAsync();
      setRecordingState("recording");
      setSelectedAyatKey(null);
      setActionMessage("");
      setActionError("");
    } catch (err) {
      setRecordingError(
        err instanceof Error ? err.message : "Gagal memulai rekaman."
      );
    }
  }, [recordingState, sessionStarted, sound]);

  const pauseRecording = useCallback(async () => {
    if (recordingState !== "recording") return;
    try {
      await recordingRef.current?.pauseAsync();
      setRecordingState("paused");
    } catch (err) {
      setRecordingError(
        err instanceof Error ? err.message : "Gagal menjeda rekaman."
      );
    }
  }, [recordingState]);

  const stopRecording = useCallback(async () => {
    if (recordingState === "idle") return;
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setRecordingUri(uri ?? null);
      setRecordingState("stopped");
      if (uri) {
        if (sound) {
          await sound.unloadAsync().catch(() => undefined);
        }
        const { sound: nextSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        setSound(nextSound);
        if (status.isLoaded) {
          setPlaybackStatus({
            positionMillis: status.positionMillis ?? 0,
            durationMillis: status.durationMillis ?? 0,
            isPlaying: Boolean(status.isPlaying),
          });
        }
      }
    } catch (err) {
      setRecordingError(
        err instanceof Error ? err.message : "Gagal menghentikan rekaman."
      );
    }
  }, [onPlaybackStatusUpdate, recordingState, sound]);

  const togglePlayback = useCallback(async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }, [sound]);

  const handleSaveRecording = useCallback(async () => {
    if (!recordingUri) return;
    setRecordingError("");
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setRecordingError("Fitur download tidak tersedia di perangkat ini.");
        return;
      }
      await Sharing.shareAsync(recordingUri, {
        dialogTitle: "Simpan rekaman",
        mimeType: "audio/m4a",
      });
    } catch (err) {
      setRecordingError(
        err instanceof Error ? err.message : "Gagal menyimpan rekaman."
      );
    }
  }, [recordingUri]);

  const handleSession = useCallback(async () => {
    setActionMessage("");
    setActionError("");
    if (sessionStarted) return;
    setSessionLoading(true);
    try {
      const result = await startQuranSession({ sesion: sessionNumber });
      setSessionStarted(true);
      setSelectedAyatKey(null);
      setActionMessage(result?.message || "Sesi dimulai. Silakan rekam.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Gagal memulai sesi."
      );
    } finally {
      setSessionLoading(false);
    }
  }, [sessionNumber, sessionStarted, startQuranSession]);

  const handleSave = useCallback(async () => {
    setActionMessage("");
    setActionError("");
    if (!sessionStarted) {
      setActionError("Mulai sesi terlebih dahulu.");
      return;
    }
    if (recordingState !== "stopped") {
      setActionError("Selesaikan rekaman terlebih dahulu.");
      return;
    }
    const ayat = selectedAyatKey
      ? ayatList.find(
          (item, index) => getAyatKey(item, index) === selectedAyatKey
        )
      : null;
    if (!ayat) {
      setActionError("Pilih satu ayat terlebih dahulu.");
      return;
    }
    setSaveLoading(true);
    try {
      const now = new Date();
      const payload = [
        {
          surahayat: String(ayat.verseid ?? ayat.id ?? ""),
          filename: buildFilename(sessionLabel, now),
          strat_time: formatTimestamp(now),
        },
      ];
      const result = await saveQuranAttendance(payload);
      setActionMessage(result?.message || "Absensi tersimpan.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Gagal menyimpan absensi."
      );
    } finally {
      setSaveLoading(false);
    }
  }, [ayatList, recordingState, saveQuranAttendance, selectedAyatKey, sessionLabel, sessionStarted]);

  const handleClear = useCallback(async () => {
    setActionMessage("");
    setActionError("");
    setClearLoading(true);
    try {
      const result = await clearQuranAttendance();
      setActionMessage(result?.message || "Absensi dibersihkan.");
      setSessionStarted(false);
      setSelectedAyatKey(null);
      await resetRecording();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Gagal menghapus absensi."
      );
    } finally {
      setClearLoading(false);
    }
  }, [clearQuranAttendance, resetRecording]);

  const handleSelectAyat = useCallback(
    (item: Ayat, index: number) => {
      if (!sessionStarted) {
        setActionError("Mulai sesi terlebih dahulu.");
        return;
      }
      if (recordingState === "idle") {
        setActionError("Klik rekam terlebih dahulu.");
        return;
      }
      setActionError("");
      setActionMessage("");
      setSelectedAyatKey(getAyatKey(item, index));
    },
    [recordingState, sessionStarted]
  );

  const surahTitle =
    surah?.transliteration || surah?.translation || "Surah";
  const selectedAyat = useMemo(() => {
    if (!selectedAyatKey) return null;
    return (
      ayatList.find(
        (item, index) => getAyatKey(item, index) === selectedAyatKey
      ) ?? null
    );
  }, [ayatList, selectedAyatKey]);

  const selectionHint = !sessionStarted
    ? "Mulai sesi terlebih dahulu."
    : recordingState === "idle"
      ? "Klik Rekam, lalu pilih satu ayat."
      : !selectedAyatKey
        ? "Pilih satu ayat untuk absensi."
        : recordingState !== "stopped"
          ? "Klik Selesai untuk mengakhiri rekaman."
          : `Ayat terpilih: Ayat ${selectedAyat?.verseid ?? "-"}.`;

  const metricItems = useMemo(
    () => [
      { label: "Sesi", value: String(sessionNumber) },
      { label: "Waktu", value: sessionLabel },
      { label: "Target", value: "1 ayat" },
    ],
    [sessionLabel, sessionNumber]
  );

  const canSelectAyat = sessionStarted && recordingState !== "idle";
  const canSave =
    sessionStarted &&
    recordingState === "stopped" &&
    Boolean(selectedAyatKey) &&
    !saveLoading;
  const recordButtonLabel = recordingState === "paused" ? "Lanjut" : "Rekam";
  const recordStatus =
    recordingState === "recording"
      ? "Sedang merekam"
      : recordingState === "paused"
        ? "Terjeda"
        : recordingState === "stopped"
          ? "Selesai"
          : "Belum merekam";
  const playbackProgress = useMemo(() => {
    if (!playbackStatus.durationMillis) return 0;
    return Math.min(1, playbackStatus.positionMillis / playbackStatus.durationMillis);
  }, [playbackStatus]);

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
            <Text style={styles.title}>Qur'an</Text>
            <Text style={styles.subtitle}>Absensi 1 ayat setiap hari.</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadQuran}
            disabled={loading}
          >
            <Ionicons name="refresh" size={18} color={EMERALD} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroOrnament} />
          <Text style={styles.heroEyebrow}>Assalamu alaikum</Text>
          <Text style={styles.heroTitle}>Absensi Quran</Text>
          <Text style={styles.heroDesc}>
            Rekam bacaan, pilih ayat, lalu simpan absensi.
          </Text>
          <View style={styles.metricRow}>
            {metricItems.map((item) => (
              <View key={item.label} style={styles.metricChip}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.recordCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rekaman</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{recordStatus}</Text>
            </View>
          </View>
          <Text style={styles.recordHint}>
            Klik Rekam -> Pilih 1 Ayat -> Baca Ayatnya -> Klik Selesai
          </Text>
          <View style={styles.recordControls}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                styles.recordPrimary,
                (!sessionStarted || recordingState === "recording") &&
                  styles.recordDisabled,
              ]}
              onPress={startRecording}
              disabled={!sessionStarted || recordingState === "recording"}
            >
              <Ionicons name="radio-button-on" size={16} color={EMERALD} />
              <Text style={styles.recordPrimaryText}>{recordButtonLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recordButton,
                styles.recordGhost,
                recordingState !== "recording" && styles.recordDisabled,
              ]}
              onPress={pauseRecording}
              disabled={recordingState !== "recording"}
            >
              <Ionicons name="pause" size={16} color={EMERALD} />
              <Text style={styles.recordGhostText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recordButton,
                styles.recordSecondary,
                (recordingState === "idle" || recordingState === "stopped") &&
                  styles.recordDisabled,
              ]}
              onPress={stopRecording}
              disabled={recordingState === "idle" || recordingState === "stopped"}
            >
              <Ionicons name="stop" size={16} color={EMERALD} />
              <Text style={styles.recordSecondaryText}>Selesai</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recordButton,
                styles.recordGhost,
                recordingState === "idle" && !recordingUri && styles.recordDisabled,
              ]}
              onPress={resetRecording}
              disabled={recordingState === "idle" && !recordingUri}
            >
              <Ionicons name="refresh" size={16} color={EMERALD} />
              <Text style={styles.recordGhostText}>Ulangi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recordStatusRow}>
            <Text style={styles.recordTime}>{formatTime(recordingDuration)}</Text>
            <Text style={styles.recordMeta}>
              {sessionStarted ? "Sesi aktif" : "Sesi belum dimulai"}
            </Text>
          </View>

          {recordingUri ? (
            <View style={styles.playerCard}>
              <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
                <Ionicons
                  name={playbackStatus.isPlaying ? "pause" : "play"}
                  size={18}
                  color={EMERALD}
                />
              </TouchableOpacity>
              <View style={styles.progressBlock}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${playbackProgress * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {formatTime(playbackStatus.positionMillis)} /{" "}
                  {formatTime(playbackStatus.durationMillis)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.saveLink}
                onPress={handleSaveRecording}
              >
                <Text style={styles.saveLinkText}>Save to disk</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.helperText}>Belum ada rekaman.</Text>
          )}

          {recordingError ? (
            <View style={styles.noticeCard}>
              <Text style={styles.errorText}>{recordingError}</Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={EMERALD} />
            <Text style={styles.loadingText}>Memuat ayat hari ini...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && (surah || ayatList.length) ? (
          <View style={styles.scriptureCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Surah dan Ayat</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {surah?.id ? `#${surah.id}` : "-"}
                </Text>
              </View>
            </View>
            <Text style={styles.surahArabic}>{surah?.name || "-"}</Text>
            <Text style={styles.surahLatin}>{surahTitle}</Text>
            <Text style={styles.surahTranslation}>
              {surah?.translation || "-"}
            </Text>

            <View style={styles.divider} />
            <Text style={styles.ayatHeading}>Pilih Ayat</Text>

            <View style={styles.ayatList}>
              {ayatList.length ? (
                ayatList.map((item, index) => {
                  const key = getAyatKey(item, index);
                  const isSelected = key === selectedAyatKey;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.ayatItem,
                        isSelected && styles.ayatItemActive,
                        !canSelectAyat && styles.ayatItemDisabled,
                      ]}
                      onPress={() => handleSelectAyat(item, index)}
                      disabled={!canSelectAyat}
                    >
                      <View style={styles.ayatHeader}>
                        <View>
                          <Text style={styles.ayatTitle}>
                            Ayat {item?.verseid ?? "-"}
                          </Text>
                          <Text style={styles.ayatMeta}>{getAyatMeta(item)}</Text>
                        </View>
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                          size={20}
                          color={isSelected ? EMERALD : TEXT_MUTED}
                        />
                      </View>
                      <Text style={styles.ayatArabic}>{item?.ayahtext || "-"}</Text>
                      <Text style={styles.ayatTranslation}>
                        {item?.indotext || "-"}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.helperText}>Ayat belum tersedia.</Text>
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Absensi</Text>
            <Text style={styles.sectionMeta}>Sesi {sessionLabel}</Text>
          </View>
          <Text style={styles.sectionDesc}>{selectionHint}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionPrimary,
                (sessionLoading || sessionStarted) && styles.actionDisabled,
              ]}
              onPress={handleSession}
              disabled={sessionLoading || sessionStarted}
            >
              {sessionLoading ? (
                <ActivityIndicator size="small" color={EMERALD} />
              ) : (
                <Ionicons name="moon-outline" size={16} color={EMERALD} />
              )}
              <Text style={styles.actionPrimaryText}>Mulai Sesi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionSecondary,
                !canSave && styles.actionDisabled,
              ]}
              onPress={handleSave}
              disabled={!canSave}
            >
              {saveLoading ? (
                <ActivityIndicator size="small" color={EMERALD} />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={EMERALD}
                />
              )}
              <Text style={styles.actionSecondaryText}>Simpan</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.actionGhost,
              clearLoading && styles.actionDisabled,
            ]}
            onPress={handleClear}
            disabled={clearLoading}
          >
            {clearLoading ? (
              <ActivityIndicator size="small" color={EMERALD} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={EMERALD} />
            )}
            <Text style={styles.actionGhostText}>Clear</Text>
          </TouchableOpacity>

          {actionMessage ? (
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={16} color={EMERALD} />
              <Text style={styles.successText}>{actionMessage}</Text>
            </View>
          ) : null}

          {actionError ? (
            <View style={styles.noticeCard}>
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SAND,
  },
  haloTop: {
    position: "absolute",
    top: -160,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: GOLD,
    opacity: 0.16,
  },
  haloBottom: {
    position: "absolute",
    bottom: -180,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: EMERALD_SOFT,
    opacity: 0.6,
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
    color: EMERALD,
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
  heroCard: {
    backgroundColor: EMERALD,
    borderRadius: 24,
    padding: SIZES.large,
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(215,181,102,0.3)",
  },
  heroGlow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: GOLD,
    opacity: 0.2,
  },
  heroOrnament: {
    position: "absolute",
    bottom: -20,
    right: 30,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    transform: [{ rotate: "35deg" }],
  },
  heroEyebrow: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.7)",
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: "#ffffff",
  },
  heroDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "rgba(255,255,255,0.8)",
  },
  metricRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metricChip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    minWidth: 86,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.7)",
  },
  metricValue: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: "#ffffff",
    marginTop: 2,
  },
  recordCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: SIZES.large,
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  recordHint: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  recordControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  recordPrimary: {
    backgroundColor: EMERALD_SOFT,
    borderColor: "rgba(15,61,46,0.2)",
  },
  recordPrimaryText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  recordSecondary: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  recordSecondaryText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  recordGhost: {
    backgroundColor: "#ffffff",
    borderColor: BORDER,
  },
  recordGhostText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  recordDisabled: {
    opacity: 0.5,
  },
  recordStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordTime: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: INK,
  },
  recordMeta: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },

  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: SAND,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBlock: {
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(15,61,46,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: EMERALD,
  },
  progressText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  saveLink: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  saveLinkText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
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
  scriptureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: SIZES.large,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(215,181,102,0.35)",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: SIZES.large,
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  sectionMeta: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: EMERALD_SOFT,
    borderWidth: 1,
    borderColor: "rgba(15,61,46,0.15)",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  surahArabic: {
    fontSize: 26,
    color: EMERALD,
    textAlign: "right",
  },
  surahLatin: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: INK,
  },
  surahTranslation: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 4,
  },
  ayatHeading: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  ayatList: {
    gap: 12,
  },
  ayatItem: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  ayatItemActive: {
    borderColor: GOLD,
    backgroundColor: "#FFFDF3",
  },
  ayatItemDisabled: {
    opacity: 0.6,
  },
  ayatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  ayatTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  ayatMeta: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  ayatArabic: {
    fontSize: 18,
    color: EMERALD,
    textAlign: "right",
    lineHeight: 30,
  },
  ayatTranslation: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: INK,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: TEXT_MUTED,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: EMERALD_SOFT,
    borderColor: "rgba(15,61,46,0.2)",
  },
  actionPrimaryText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  actionSecondary: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  actionSecondaryText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  actionGhost: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#ffffff",
  },
  actionGhostText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: EMERALD,
  },
  actionDisabled: {
    opacity: 0.6,
  },
  successCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: EMERALD_SOFT,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15,61,46,0.2)",
  },
  successText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: EMERALD,
  },
});
