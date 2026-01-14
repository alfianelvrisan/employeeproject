import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Sharing from "expo-sharing";
import Modal from "react-native-modal";
import ViewShot, { captureRef } from "react-native-view-shot";
import { FONTS, SIZES } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

// Constants & Types
const { width } = Dimensions.get("window");
const EMERALD = "#044D29"; // Deep Islamic Green
const GOLD = "#C5A059";     // Muted Gold
const CREAM = "#FDFBF7";    // Warm Paper
const TEXT_DARK = "#1E293B";
const TEXT_MUTED = "#64748B";

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

const pad2 = (value: number) => String(value).padStart(2, "0");
const formatTime = (valueMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
};
const formatTimestamp = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}:${pad2(date.getSeconds())}`;
};

const buildFilename = (prefix: string, date: Date) => {
  const stamp = `${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${date.getFullYear()}${pad2(
    date.getHours()
  )}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  return `${prefix}${stamp}`;
};

// --- Visualizer Component ---
const Bar = ({ level }: { level: number }) => {
  const heightAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Map level (0..1) to height range (10..50)
    // Add randomness so bars look different
    const randomFactor = 0.5 + Math.random(); // 0.5 - 1.5 multiplier
    const targetHeight = 10 + (level * 40 * randomFactor);

    Animated.timing(heightAnim, {
      toValue: targetHeight,
      duration: 50, // Fast update matches metering interval
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();
  }, [level]);

  return (
    <Animated.View
      style={{
        width: 4,
        height: heightAnim,
        backgroundColor: GOLD,
        borderRadius: 2,
        marginHorizontal: 2,
      }}
    />
  );
};

const AudioVisualizer = ({ metering }: { metering: number }) => {
  // Normalize metering (-60dB to 0dB) -> 0 to 1
  const level = Math.max(0, (metering + 60) / 60);

  const bars = Array.from({ length: 25 }).map((_, i) => (
    <Bar key={i} level={level} />
  ));

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", height: 60 }}>
      {bars}
    </View>
  );
};

export default function QuranScreen() {
  const {
    fetchQuran,
    startQuranSession,
    saveQuranAttendance,
    clearQuranAttendance,
    fetchProfile,
  } = useAuth();

  const insets = useSafeAreaInsets();

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [gender, setGender] = useState<string>("Male");
  const [userName, setUserName] = useState<string>("");
  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayatList, setAyatList] = useState<Ayat[]>([]);

  // Recording
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackState>({
    positionMillis: 0,
    durationMillis: 0,
    isPlaying: false,
  });
  const [metering, setMetering] = useState(-160); // dB value

  // Flow State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastSubmissionData, setLastSubmissionData] = useState<{ uri: string | null } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const handleShareImage = async () => {
    try {
      if (!viewShotRef.current) return;
      const uri = await viewShotRef.current.capture();
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Info", "Sharing belum tersedia di perangkat ini.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Bagikan Bukti Tilawah',
        UTI: 'public.image'
      });
    } catch (e) {
      Alert.alert("Gagal", "Gagal memproses gambar.");
    }
  };

  // --- Initialization ---
  const initPage = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    // DO NOT reset isSubmitted if we prefer to keep showing result.
    // However, if it's a fresh load (e.g. tab switch), we reset.
    // If it's an auto-refresh after submission, we might want to keep the success card but load new ayats?
    // User requirement: "Directly refresh but keep showing result".
    // So we need separate states for "View Data" and "User Session State".

    // Logic: 
    // If isRefresh is true, we simply fetch new ayat data into `ayatList`.
    // We DON'T scrub the `recordingUri` or `isSubmitted` state immediately.

    if (!isRefresh) {
      setIsSubmitted(false);
      setRecordingState("idle");
      setRecordingUri(null);
      setRecordingDuration(0);
      setLastSubmissionData(null);
    }

    try {
      if (!isRefresh) await clearQuranAttendance(1);

      const profile = await fetchProfile();
      if (profile) {
        setGender(profile.kelamin || profile.gender || "Male");
        setUserName(profile.nama_lengkap || profile.nama || profile.name || "User");
      }

      const quranData = await fetchQuran();

      let sData = [];
      let aData = [];
      if (quranData) {
        const raw = quranData as any;
        sData = Array.isArray(raw.surah) ? raw.surah
          : Array.isArray(raw.Surah) ? raw.Surah
            : [];
        aData = Array.isArray(raw.ayat) ? raw.ayat
          : Array.isArray(raw.Ayat) ? raw.Ayat
            : [];
      }

      setSurah(sData.length ? sData[0] : null);
      setAyatList(aData);

    } catch (err) {
      console.log("Init Error:", err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, [clearQuranAttendance, fetchProfile, fetchQuran]);

  useEffect(() => {
    initPage();
    return () => {
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => { });
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => { });
    };
  }, [initPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initPage(true);
    setRefreshing(false);
  }, [initPage]);

  // --- Audio Logic ---
  const startRecording = async () => {
    try {
      if (recordingState === "recording") return;
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Reset for new recording session
      setRecordingUri(null);
      setRecordingDuration(0);
      setIsSubmitted(false);

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Izin Ditolak", "Butuh izin mikrofon.");
        return;
      }

      // SEND START SIGNAL (Ayat Pertama)
      // We do this concurrently with starting recording to not delay UI
      sendStartSignal();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      recording.setProgressUpdateInterval(50);
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis);
          if (status.metering !== undefined) {
            setMetering(status.metering);
          }
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setRecordingState("recording");

    } catch (err) {
      Alert.alert("Error", "Gagal memulai rekaman.");
    }
  };

  const sendStartSignal = async () => {
    if (ayatList.length === 0) return;
    try {
      const startAyat = ayatList[0];
      const now = new Date();
      const fname = buildFilename("ABSSUBUH", now);
      const nowStr = formatTimestamp(now);

      const payload = [{
        surahayat: String(startAyat.id || startAyat.verseid || 0),
        filename: fname,
        strat_time: nowStr,
      }];

      console.log("Sending Start Signal...");
      // We trigger save but don't await blocking UI? Or better await to ensure connection?
      // Making it non-blocking for better UX start.
      saveQuranAttendance(payload).catch(err => console.log("Start Signal Failed", err));
    } catch (e) {
      console.log("Error prep start signal", e);
    }
  };

  const pauseRecording = async () => {
    if (!recordingRef.current) return;
    try {
      if (recordingState === "recording") {
        await recordingRef.current.pauseAsync();
        setRecordingState("paused");
      } else {
        await recordingRef.current.startAsync();
        setRecordingState("recording");
      }
    } catch (err) { }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setProcessing(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setRecordingUri(uri);
      setRecordingState("stopped");

      if (uri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          (status) => {
            if (status.isLoaded) {
              setPlaybackStatus({
                positionMillis: status.positionMillis,
                durationMillis: status.durationMillis || 0,
                isPlaying: status.isPlaying,
              });
            }
          }
        );
        soundRef.current = sound;

        // SEND END SIGNAL (Ayat Terakhir)
        if (ayatList.length > 0) {
          const endAyat = ayatList[ayatList.length - 1]; // Last
          const now = new Date();
          const fname = buildFilename("ABSSUBUH", now);
          const nowStr = formatTimestamp(now);

          const payload = [{
            surahayat: String(endAyat.id || endAyat.verseid || 0),
            filename: fname,
            strat_time: nowStr,
          }];

          await saveQuranAttendance(payload);

          // SUCCESS FLOW:
          // 1. Mark submitted
          // 2. Refresh page to get NEXT ayat (load new data)
          // 3. BUT keep `lastSubmissionData` to show the player/result of what we JUST did.

          setLastSubmissionData({ uri }); // Store current record to keep showing it
          setIsSubmitted(true);
          setShowSuccessModal(true);

          // Fetch next day/ayat immediately
          await initPage(true);

        } else {
          Alert.alert("Gagal", "Data ayat kosong.");
        }
      }
    } catch (err) {
      Alert.alert("Gagal", "Gagal menyimpan absensi: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessing(false);
    }
  };

  const togglePlayback = async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  // Logic: When refreshing, if we have a recording, we want to play THAT recording, not null.
  // Actually, `recordingUri` is cleared in initPage(false). 
  // initPage(true) KEEPS `recordingUri` if we don't clear it.
  // I modified `initPage` to NOT clear states if isRefresh is true. 
  // However, I clearing it manually in `saveQuranAttendance` flow above might be better if I want "fresh slate for recording" but "keep playback".
  // Actually, sticking to `recordingUri` state is fine as long as `initPage(true)` doesn't wipe it.
  // Modified initPage logic above to respect isRefresh.

  const downloadRecording = async () => {
    // If submitted, use lastSubmissionData or current recordingUri
    const targetUri = lastSubmissionData?.uri || recordingUri;

    if (!targetUri) return;
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Info", "Fitur berbagi tidak tersedia.");
        return;
      }
      await Sharing.shareAsync(targetUri, {
        mimeType: 'audio/x-m4a',
        dialogTitle: 'Simpan Rekaman Tilawah',
        UTI: 'public.audio'
      });
    } catch (err) {
      Alert.alert("Error", "Gagal mengunduh rekaman.");
    }
  };

  const handleNextAyat = async () => {
    // If user clicks "Lanjut", we basically just reset the Success card state
    // The data is already refreshed from the auto-refresh in stopRecording.
    setIsSubmitted(false);
    setLastSubmissionData(null);
    setRecordingUri(null); // Clear previous recording
    setRecordingState("idle");
  };

  const handleClear = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      performClear(2);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        performClear(1);
        clickTimeoutRef.current = null;
      }, 300);
    }
  };

  const performClear = async (level: number) => {
    setProcessing(true);
    try {
      await clearQuranAttendance(level);
      Alert.alert("Sukses", "Sesi berhasil direset (Level " + level + ").", [{ text: "OK", onPress: () => initPage(true) }]);
    } catch {
      Alert.alert("Gagal", "Gagal reset sesi.");
    } finally {
      setProcessing(false);
    }
  };

  const handleHalangan = async () => {
    setProcessing(true);
    try {
      const res = await startQuranSession({ sesion: 1 });
      if (res == '1' || res?.status === true || res?.success === true) {
        Alert.alert("Berhasil", "Halangan tercatat.");
      } else {
        Alert.alert("Info", "Sudah tercatat hari ini.");
      }
    } catch {
      Alert.alert("Gagal", "Gagal mencatat halangan.");
    } finally {
      setProcessing(false);
    }
  };

  const isFemale =
    gender.toLowerCase().includes("female") ||
    gender.toLowerCase().includes("perempuan") ||
    gender.toLowerCase().includes("wanita");

  // --- Components ---
  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top, height: 120 + insets.top }]}>
      <View style={styles.headerOverlay} />
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Jihad Subuh</Text>
        <View style={styles.badgeLine}>
          <Ionicons name="book" size={12} color={GOLD} />
          <Text style={styles.headerSub}>One Day One Ayat</Text>
        </View>
      </View>
      <Image
        source={{ uri: "file:///C:/Users/BINA/.gemini/antigravity/brain/78a55ef5-4904-4c22-bfde-01d79b19a0a3/islamic_header_pattern_1768359293587.png" }}
        style={styles.headerBg}
      />
    </View>
  );

  // Recorder Section Component
  const renderRecorder = () => {
    if (recordingState === "idle") {
      return (
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Main Record Button */}
          <TouchableOpacity style={[styles.topRecBtn, { flex: 1 }]} onPress={startRecording}>
            <View style={styles.topRecIcon}>
              <Ionicons name="mic" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.topRecTitle}>Mulai Tilawah</Text>
              <Text style={styles.topRecSub}>Tekan untuk merekam</Text>
            </View>
          </TouchableOpacity>

          {/* Side Buttons Column */}
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={[styles.sideRefreshBtn, !isFemale && { flex: 1 }]}
              onPress={handleClear}
              disabled={processing}
            >
              <Ionicons name="refresh" size={22} color={EMERALD} />
              <Text style={styles.sideRefreshText}>Refres</Text>
            </TouchableOpacity>

            {isFemale && (
              <TouchableOpacity style={styles.sideHalanganBtn} onPress={handleHalangan} disabled={processing}>
                <Ionicons name="hand-left" size={22} color="#EF4444" />
                <Text style={styles.sideHalanganText}>Haid</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // Active Recording / Paused
    return (
      <View style={styles.topRecActive}>
        <View style={styles.topRecHeader}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingLabel}>{recordingState === "recording" ? "Merekam..." : "Terjeda"}</Text>
          <Text style={styles.timerLarge}>{formatTime(recordingDuration)}</Text>
        </View>

        {/* VISUALIZER */}
        <AudioVisualizer metering={recordingState === "recording" ? metering : -160} />

        {/* Controls */}
        <View style={styles.topRecControls}>
          <TouchableOpacity style={styles.miniControl} onPress={pauseRecording}>
            <Ionicons name={recordingState === "recording" ? "pause" : "play"} size={20} color={EMERALD} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopControl} onPress={stopRecording}>
            <View style={styles.stopSquare} />
          </TouchableOpacity>
        </View>
        <Text style={styles.hintText}>Tekan kotak merah untuk selesai & kirim (Absen akhir)</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      {renderHeader()}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EMERALD} colors={[EMERALD]} />
        }
      >



        {loading && !isSubmitted ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={EMERALD} />
            <Text style={styles.loadText}>Menyiapkan Ayat...</Text>
          </View>
        ) : !isSubmitted && ayatList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="moon" size={48} color={GOLD} />
            <Text style={styles.emptyTitle}>Selesai untuk Hari Ini</Text>
            <Text style={styles.emptySub}>Semoga Allah menerima amal ibadah kita.</Text>
          </View>
        ) : (
          <View>
            {/* 1. RECORDER UI (Top) - Only show if NOT successful yet */}
            {!isSubmitted && (
              <View style={styles.topRecorderContainer}>
                {renderRecorder()}
              </View>
            )}

            {/* 2. SUCCESS UI (Top - if submitted) */}
            {isSubmitted && (
              <View style={styles.successCard}>
                <View style={styles.successIconHeader}>
                  <Ionicons name="checkmark-circle" size={48} color={EMERALD} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.successTitle}>Alhamdulillah</Text>
                    <Text style={styles.successSub}>Rekaman Tersimpan. Ayat berikutnya telah dimuat di bawah.</Text>
                  </View>
                </View>

                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.playResultBtn} onPress={togglePlayback}>
                    <Ionicons name={playbackStatus.isPlaying ? "pause" : "play"} size={20} color={EMERALD} />
                    <Text style={styles.playResultText}>{playbackStatus.isPlaying ? "Jeda" : "Putar Hasil Rekaman"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.downloadResultBtn} onPress={downloadRecording}>
                    <Ionicons name="download-outline" size={20} color={TEXT_DARK} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={handleNextAyat}>
                  <Text style={styles.nextBtnText}>Tutup & Lanjut Baca Ayat Baru</Text>
                  <Ionicons name="close-circle" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* 3. SURAH BANNER */}
            {surah && (
              <View style={styles.surahBanner}>
                <ImageBackground
                  source={{ uri: "file:///C:/Users/BINA/.gemini/antigravity/brain/78a55ef5-4904-4c22-bfde-01d79b19a0a3/islamic_header_pattern_1768359293587.png" }}
                  imageStyle={{ opacity: 0.1, borderRadius: 20 }}
                  style={styles.surahBannerInner}
                >
                  <View style={styles.surahFrame}>
                    <Text style={styles.surahArabic}>{surah.name}</Text>
                    <Text style={styles.surahTitle}>{surah.transliteration}</Text>
                    <Text style={styles.surahMeaning}>"{surah.translation}"</Text>
                    <View style={styles.dividerDecor} />
                  </View>
                </ImageBackground>
              </View>
            )}

            {/* 4. AYAT LIST */}
            {/* 4. AYAT LIST REPLACE */}
            <View style={styles.ayatContainer}>
              {ayatList.slice().reverse().map((ayat, index) => {
                // Since we reversed, the "end" ayat is now at index 0
                // Logic based on original list: The styling was applied to the last item of the ORIGINAL list.
                // The user says "ayat terakhir ... di taruh di atas".
                // So visually the list is inverted.
                // We should check if this specific ayat IS the last one from original data?
                // Or just style the top one?
                // Typically "ayat terakhir" means the high numbered one. 
                // If we reverse, high numbered one comes first (top).

                // My previous logic for styling: const isEnd = index === ayatList.length - 1;
                // If I reverse the array:
                // [Ayat 10, Ayat 9, ...]
                // index 0 is Ayat 10 (Last one).
                // So we want to style the FIRST item in this reversed list if we want to highlight the "last" ayat.

                const isFirstInList = index === 0;
                return (
                  <View key={index} style={[styles.ayatCard, isFirstInList ? styles.ayatCardEnd : { opacity: 0.6 }]}>
                    <View style={styles.numberColumn}>
                      <View style={styles.ayatNumberBadge}>
                        <Text style={styles.ayatNumberText}>{ayat.verseid}</Text>
                      </View>
                    </View>
                    <View style={styles.textColumn}>
                      <Text style={styles.ayatArabic}>{ayat.ayahtext}</Text>
                      <Text style={styles.ayatIndo}>{ayat.indotext}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        isVisible={!!showSuccessModal}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
        onBackdropPress={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalCenter}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.shareCard}>
              <View style={styles.shareHeader}>
                <Image
                  source={{ uri: "https://laskarbuah-sales.s3.ap-southeast-3.amazonaws.com/foto_produk/3e657f34-c3f5-4551-80f6-e30509a7617d.png" }}
                  style={{ width: 120, height: 120, marginBottom: 4 }}
                  resizeMode="contain"
                />
                <Text style={[styles.shareTitle, { textAlign: "center" }]}>{userName || "User"}</Text>
                <Text style={styles.shareSub}>Terimakasih Untuk 1 Ayat hari ini</Text>
              </View>

              <View style={styles.shareContent}>
                <Text style={styles.shareSurah}>{surah?.name}</Text>
                <Text style={styles.shareAyatDetail}>
                  {surah?.transliteration} • Ayat {ayatList[0]?.verseid} - {ayatList[ayatList.length - 1]?.verseid}
                </Text>
                <Text style={styles.shareDate}>{formatTimestamp(new Date())}</Text>
              </View>

              <View style={styles.shareFooter}>
                <Text style={styles.shareFooterText}>Jihad Subuh - One Day One Ayat</Text>
              </View>
            </View>
          </ViewShot>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareImage}>
              <Ionicons name="share-social" size={20} color="#FFF" />
              <Text style={styles.shareBtnText}>Share ke WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.closeModalText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {processing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingOverlayText}>Memproses...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  scrollContent: { paddingBottom: 100, paddingTop: 10 },

  headerContainer: {
    height: 120,
    backgroundColor: EMERALD,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    elevation: 4,
    overflow: "hidden"
  },
  headerBg: { position: "absolute", width: "100%", height: "100%", opacity: 0.2 },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.1)" },
  headerContent: { alignItems: "center", zIndex: 10 },
  headerTitle: { color: GOLD, fontSize: 26, fontFamily: FONTS.bold, marginBottom: 4 },
  badgeLine: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerSub: { color: "#FFF", fontSize: 12, fontFamily: FONTS.medium },

  actionBar: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, marginBottom: 10 },
  clearBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4, borderWidth: 1, borderColor: "#E2E8F0" },
  clearText: { color: TEXT_DARK, fontFamily: FONTS.medium, fontSize: 11 },

  centerBox: { alignItems: "center", padding: 40 },
  loadText: { marginTop: 12, color: TEXT_MUTED, fontSize: 14 },
  emptyCard: { margin: 20, backgroundColor: "#FFF", padding: 30, borderRadius: 20, alignItems: "center", elevation: 2 },
  emptyTitle: { marginTop: 16, fontFamily: FONTS.bold, color: TEXT_DARK, fontSize: 16 },
  emptySub: { marginTop: 8, color: TEXT_MUTED, textAlign: "center", fontSize: 12 },

  // --- TOP RECORDER STYLES ---
  topRecorderContainer: { paddingHorizontal: 16, marginBottom: 16 },
  topRecBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: EMERALD,
    padding: 16, borderRadius: 20, elevation: 4, gap: 16
  },
  topRecIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center"
  },
  topRecTitle: { color: "#FFF", fontFamily: FONTS.bold, fontSize: 16 },
  topRecSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  sideRefreshBtn: {
    alignItems: "center", justifyContent: "center", backgroundColor: "#FFF",
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, gap: 4,
    borderWidth: 1, borderColor: "#E2E8F0", minWidth: 80
  },
  sideRefreshText: { color: EMERALD, fontFamily: FONTS.bold, fontSize: 12 },

  sideHalanganBtn: {
    alignItems: "center", justifyContent: "center", backgroundColor: "#FFF",
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, gap: 4,
    borderWidth: 1, borderColor: "#FECACA", minWidth: 80
  },
  sideHalanganText: { color: "#EF4444", fontFamily: FONTS.bold, fontSize: 12 },

  halanganRecBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#EF4444",
    padding: 16, borderRadius: 20, elevation: 4, gap: 16
  },
  halanganRecIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center"
  },
  halanganRecTitle: { color: "#FFF", fontFamily: FONTS.bold, fontSize: 16 },
  halanganRecSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  topRecActive: {
    backgroundColor: "#FFF", borderRadius: 24, padding: 20, elevation: 4,
    borderWidth: 1, borderColor: "#E2E8F0"
  },
  topRecHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", marginRight: 8 },
  recordingLabel: { color: "#EF4444", fontFamily: FONTS.bold, fontSize: 12, flex: 1 },
  timerLarge: { fontFamily: FONTS.bold, fontSize: 16, color: TEXT_DARK, fontVariant: ["tabular-nums"] },

  // Visualizer in Top Rec
  topRecControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 12 },
  miniControl: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: EMERALD },
  stopControl: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", elevation: 4, borderWidth: 4, borderColor: "#FECACA" },
  stopSquare: { width: 20, height: 20, borderRadius: 4, backgroundColor: "#FFF" }, // Square icon for stop

  // Success State (Moved to Top)
  successCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "#FFF", borderRadius: 24, padding: 20, elevation: 2, borderWidth: 1, borderColor: "#DCFCE7" },
  successIconHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  successTitle: { fontSize: 18, fontFamily: FONTS.bold, color: EMERALD },
  successSub: { fontSize: 12, color: TEXT_MUTED, flexWrap: "wrap" },
  resultActions: { flexDirection: "row", gap: 8, marginBottom: 16 },
  playResultBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6, flex: 1 },
  playResultText: { color: EMERALD, fontFamily: FONTS.bold, fontSize: 12 },
  downloadResultBtn: { width: 40, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9", borderRadius: 12 },
  nextBtn: { backgroundColor: EMERALD, padding: 14, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, elevation: 2 },
  nextBtnText: { color: "#FFF", fontFamily: FONTS.bold },

  // Surah Banner
  surahBanner: { marginHorizontal: 16, marginBottom: 12, elevation: 3 },
  surahBannerInner: { backgroundColor: "#FFF", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: GOLD },
  surahFrame: { alignItems: "center", padding: 24, borderWidth: 1, borderColor: GOLD, margin: 4, borderRadius: 16, borderStyle: "dashed" },
  surahArabic: { fontFamily: "ArabQuran", fontSize: 36, color: EMERALD, marginBottom: 8 },
  surahTitle: { fontFamily: FONTS.bold, fontSize: 18, color: TEXT_DARK, letterSpacing: 1 },
  surahMeaning: { fontFamily: FONTS.medium, fontSize: 12, color: TEXT_MUTED, fontStyle: "italic", marginTop: 2 },
  dividerDecor: { height: 2, width: 40, backgroundColor: GOLD, marginTop: 16 },

  ayatContainer: { gap: 8 },
  ayatCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 20, padding: 16,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, borderColor: "rgba(0,0,0,0.02)",
    flexDirection: "row", alignItems: "flex-start", gap: 12
  },
  ayatCardEnd: {
    borderWidth: 1, borderColor: EMERALD, backgroundColor: "#F0FDF4"
  },

  numberColumn: { width: 36, alignItems: "center", paddingTop: 4 },
  ayatNumberBadge: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: EMERALD,
    alignItems: "center", justifyContent: "center",
    transform: [{ rotate: "45deg" }]
  },
  ayatNumberText: { color: "#FFFFFF", fontFamily: FONTS.bold, fontSize: 11, transform: [{ rotate: "-45deg" }] },

  textColumn: { flex: 1 },
  ayatArabic: {
    fontSize: 28,
    fontFamily: "ArabQuran", color: TEXT_DARK, textAlign: "right", lineHeight: 48, marginBottom: 12
  },
  ayatIndo: { fontSize: 13, fontFamily: FONTS.regular, color: TEXT_MUTED, textAlign: "left", lineHeight: 20 },

  bottomArea: { paddingHorizontal: 16, marginTop: 20 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", zIndex: 999 },
  loadingOverlayText: { color: "#FFF", marginTop: 12, fontFamily: FONTS.bold },

  // Modal Share Styles
  modalCenter: { justifyContent: "center", alignItems: "center" },
  shareCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  shareHeader: { alignItems: "center", gap: 8 },
  shareTitle: { fontSize: 24, fontFamily: FONTS.bold, color: EMERALD },
  shareSub: { fontSize: 14, color: TEXT_MUTED, fontFamily: FONTS.medium },
  shareContent: { alignItems: "center", width: "100%", paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  shareSurah: { fontSize: 36, fontFamily: "ArabQuran", color: GOLD, marginBottom: 8, textAlign: "center", lineHeight: 50 },
  shareAyatDetail: { fontSize: 16, color: TEXT_DARK, fontFamily: FONTS.bold },
  shareDate: { fontSize: 12, color: TEXT_MUTED, marginTop: 8 },
  shareFooter: { marginTop: 8 },
  shareFooterText: { fontSize: 12, color: EMERALD, fontFamily: FONTS.medium, opacity: 0.8 },

  modalActions: { marginTop: 20, width: "85%", flexDirection: "row", gap: 12, justifyContent: "center" },
  shareBtn: {
    flex: 1, backgroundColor: "#25D366", // WA Color
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, gap: 6, elevation: 1
  },
  shareBtnText: { color: "#FFF", fontFamily: FONTS.bold, fontSize: 13 },
  closeModalBtn: {
    flex: 0.6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0"
  },
  closeModalText: { color: TEXT_MUTED, fontFamily: FONTS.bold, fontSize: 13 },
  hintText: { textAlign: "center", color: TEXT_MUTED, fontSize: 10, marginTop: 8 }
});
