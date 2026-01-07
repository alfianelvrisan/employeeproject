import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Easing,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";

// Import komponen & tema yang sudah dibuat
import { COLORS, SIZES, FONTS } from "../../constants/theme";
import AuthModal from "../../components/AuthModal";

export default function LoginScreen() {
  // State terpusat untuk mengontrol modal
  const [modalState, setModalState] = useState({
    visible: false,
    type: "login", // Tipe awal: 'login', 'register', 'forgotPin', 'whatsappRegister'
  });
  const slideValue = useRef(new Animated.Value(0)).current;
  const KNOB_WIDTH = 120;
  const DEFAULT_SLIDE_DISTANCE = 180;
  const [trackWidth, setTrackWidth] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const slideDistance = useMemo(() => {
    if (trackWidth <= 0) return DEFAULT_SLIDE_DISTANCE;
    const calculated = trackWidth - KNOB_WIDTH;
    return calculated > 40 ? calculated : DEFAULT_SLIDE_DISTANCE;
  }, [trackWidth]);
  const fillWidth = useMemo(
    () => Animated.add(slideValue, KNOB_WIDTH),
    [slideValue]
  );

  /**
   * Membuka modal dengan tipe konten tertentu.
   * @param {'login' | 'register'} type - Tipe form yang ingin ditampilkan.
   */
  const handleOpenModal = useCallback((type: "login" | "register") => {
    setModalState({ visible: true, type });
  }, []);

  /**
   * Menutup modal.
   */
  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, visible: false }));
  };

  /**
   * Mengganti tipe konten di dalam modal yang sedang aktif.
   * @param {'forgotPin' | 'whatsappRegister'} newType - Tipe form baru.
   */
  const handleSwitchModalType = (newType) => {
    setModalState((prev) => ({ ...prev, type: newType }));
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clockText = useMemo(
    () =>
      currentTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [currentTime]
  );

  const dateText = useMemo(
    () =>
      currentTime.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [currentTime]
  );

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const sliderPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 6,
        onPanResponderMove: (_, gestureState) => {
          const clamped = Math.max(0, Math.min(slideDistance, gestureState.dx));
          slideValue.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > slideDistance * 0.65) {
            Animated.spring(slideValue, {
              toValue: slideDistance,
              bounciness: 10,
              useNativeDriver: false,
            }).start(() => {
              handleOpenModal("login");
              Animated.timing(slideValue, {
                toValue: 0,
                duration: 420,
                easing: Easing.out(Easing.circle),
                useNativeDriver: false,
              }).start();
            });
          } else {
            Animated.spring(slideValue, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [handleOpenModal, slideDistance, slideValue]
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.backgroundContainer}>
        <Video
          source={require("../../assets/images/iconbg.mp4")}
          style={styles.backgroundVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.switchCard}>
            <View style={styles.sliderArea}>
              <Text style={styles.sliderHint}>Swipe right to Login</Text>
              <View style={styles.sliderTrack} onLayout={handleTrackLayout}>
                <View style={styles.sliderRail} />
                <Animated.View
                  pointerEvents="none"
                  style={[styles.sliderFill, { width: fillWidth }]}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255,243,179,0.95)",
                      "rgba(255,199,74,0.95)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.knobWrapper,
                    { transform: [{ translateX: slideValue }] },
                  ]}
                  {...sliderPanResponder.panHandlers}
                >
                  <LinearGradient
                    colors={["#fff2b8", "#ffde6a", "#ffc24d"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.knob}
                  >
                    <Ionicons name="sparkles" size={16} color="#3a2f00" />
                    <View style={styles.knobArrows}>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#3a2f00"
                      />
                    </View>
                  </LinearGradient>
                </Animated.View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => router.push("/profile/subProfil/PusatBantuan")}
          >
            <Ionicons name="help-circle-outline" size={16} color="#000000ff" />
            <Text style={styles.helpText}>Help Desk</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <AuthModal
        visible={modalState.visible}
        type={modalState.type}
        onClose={handleCloseModal}
        onSwitchType={handleSwitchModalType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffde6a",
  },
  backgroundContainer: {
    flex: 1,
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.extraLarge,
    justifyContent: "space-between",
    gap: SIZES.large,
  },
  switchCard: {
    backgroundColor: "#FFDE6A",
    borderRadius: 28,
    padding: SIZES.large,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.4)",
    alignSelf: "flex-start",
    width: "100%",
    maxWidth: 420,
    gap: SIZES.small,
    shadowColor: "rgba(88, 87, 0, 0.25)",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 8,
  },
  cardEyebrow: {
    color: "#8dd5ff",
    fontSize: 14,
    fontFamily: FONTS.medium,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cardTitle: {
    marginTop: 8,
    color: COLORS.white,
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  cardSubtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  connectionBox: {
    marginTop: SIZES.large,
    backgroundColor: "rgba(5,15,35,0.28)",
    borderRadius: 24,
    padding: SIZES.large,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  statusLabel: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  statusValue: {
    marginTop: 4,
    color: "#fff",
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  sliderArea: {
    width: "100%",
    gap: 12,
  },
  sliderTrack: {
    width: "100%",
    maxWidth: 360,
    height: 72,
    borderRadius: 36,
    backgroundColor: "transparent",
    overflow: "visible",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  sliderRail: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.7)",
    backgroundColor: "rgba(255,255,255,0.7)",
    shadowColor: "rgba(255,190,70,0.45)",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,222,106,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,199,74,0.75)",
    overflow: "hidden",
  },
  sliderHint: {
    fontSize: 15,
    letterSpacing: 2,
    color: "rgba(20, 20, 20, 0.65)",
    textTransform: "uppercase",
    fontFamily: FONTS.bold,
  },
  knobWrapper: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -28,
  },
  knob: {
    width: 120,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    shadowColor: "rgba(255,169,20,0.5)",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  knobArrows: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(122,92,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,222,106,0.6)",
    alignSelf: "flex-start",
  },
  helpText: {
    color: "#4a3600",
    fontFamily: FONTS.medium,
    fontSize: SIZES.font * 0.85,
  },
});
