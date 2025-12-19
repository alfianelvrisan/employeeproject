import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Import komponen & tema yang sudah dibuat
import { COLORS, SIZES, FONTS } from "../../constants/theme";
import AuthModal from "../../components/AuthModal";

export default function LoginScreen() {
  // State terpusat untuk mengontrol modal
  const [modalState, setModalState] = useState({
    visible: false,
    type: "login", // Tipe awal: 'login', 'register', 'forgotPin', 'whatsappRegister'
  });

  /**
   * Membuka modal dengan tipe konten tertentu.
   * @param {'login' | 'register'} type - Tipe form yang ingin ditampilkan.
   */
  const handleOpenModal = (type) => {
    setModalState({ visible: true, type });
  };

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

  return (
    <ImageBackground
      source={require("../../assets/images/update_bglogin3.jpg")}
      style={styles.screen}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.adSlot} />

        <View style={styles.bottomPanel}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                style={styles.logo}
                source={require("../../assets/images/update_logolbi.png")}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => router.push("/profile/subProfil/PusatBantuan")}
          >
            <Ionicons name="lock-open-outline" size={20} color="#d5e9ff" />
            <Text style={styles.helpText}>Butuh bantuan? Help Desk</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleOpenModal("login")}
              style={styles.buttonShadow}
            >
              <LinearGradient
                colors={["#ffea00", "#ffc400", "#ff9100"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleOpenModal("register")}
              style={styles.buttonShadow}
            >
              <LinearGradient
                colors={["#fff7c2", "#ffd85f", "#ff9f1c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Buat Akun</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <AuthModal
          visible={modalState.visible}
          type={modalState.type}
          onClose={handleCloseModal}
          onSwitchType={handleSwitchModalType}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f4d92",
  },
  bgImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1 }],
    alignSelf: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.extraLarge,
    paddingVertical: SIZES.large,
    justifyContent: "space-between",
  },
  header: {
    marginTop: SIZES.extraLarge,
    alignItems: "flex-end",
    marginBottom: SIZES.large,
    alignSelf: "flex-end",
    marginRight: SIZES.large,
  },
  logoBadge: {
    height: 96,
    width: 96,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.large,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logo: {
    height: 84,
    width: 84,
    borderRadius: 15,
    resizeMode: "contain",
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontFamily: FONTS.bold,
    textAlign: "center",
    marginBottom: SIZES.small,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: SIZES.font,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SIZES.large,
  },
  footer: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 24,
    padding: SIZES.extraLarge,
    marginBottom: SIZES.large,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#0a3e7a",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 12,
  },
  bottomPanel: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: SIZES.large,
  },
  buttonContainer: {
    width: "60%",
    maxWidth: 280,
    alignSelf: "flex-end",
    marginRight: SIZES.large,
    gap: SIZES.small,
  },
  adSlot: {
    flex: 1,
  },
  buttonShadow: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0a3e7a",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  primaryText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
  },
  secondaryButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  secondaryText: {
    color: COLORS.black,
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginRight: SIZES.large,
    marginBottom: SIZES.small,
    paddingVertical: SIZES.small,
  },
  helpText: {
    marginLeft: SIZES.base,
    color: "#d5e9ff",
    fontFamily: FONTS.regular,
    fontSize: SIZES.font,
  },
});
