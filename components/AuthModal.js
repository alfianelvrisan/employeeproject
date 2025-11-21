import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext"; // Sesuaikan path jika perlu
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

// Import komponen & tema
import { COLORS, SIZES, FONTS } from "../constants/theme";
import IconTextInput from "./IconTextInput";

// Data Kode Negara (bisa dipindah ke file constants terpisah)
const CountryCodes = [
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  // ...tambahkan sisa kode negara dari kode lama Anda
];

const AuthModal = ({ visible, type, onClose, onSwitchType }) => {
  const { login, cekode, cekwhastapp } = useAuth();
  const brandGradient = ["#52c7ff", "#2f89ff", "#1f5fd6"];
  const softGradient = ["#ffffff", "#e6f2ff", "#cee3ff"];

  // State Internal Modal
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State untuk form
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [kode, setKode] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedCode, setSelectedCode] = useState("+62");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Membersihkan state setiap kali modal ditutup
  useEffect(() => {
    if (!visible) {
      setError("");
      setIsLoading(false);
      setNik("");
      setPassword("");
      setKode("");
      setWhatsapp("");
    }
  }, [visible]);

  // Handler utama untuk submit
  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (type === "login") {
        await login(nik, password);
        router.push("/"); // Arahkan ke home jika berhasil
        onClose(); // Tutup modal
      } 
      else if (type === "register") {
        const result = await cekode(kode);
        if (result === 1) {
          onSwitchType("whatsappRegister"); // Ganti tipe modal ke cek WA untuk register
        } else {
          setError("Kode Perusahaan tidak valid atau terjadi kesalahan.");
        }
      } 
      else if (type === "whatsappRegister") {
        const result = await cekwhastapp(whatsapp);
        if (result === 0) { // Nomor belum terdaftar, bisa lanjut
          router.push({
            pathname: "/screens/otpLogin",
            params: { whatsapp, kode, selectedCode, option: 1 },
          });
          onClose();
        } else {
          setError("Nomor WhatsApp sudah terdaftar.");
        }
      } 
      else if (type === "forgotPin") {
        const result = await cekwhastapp(whatsapp);
        if (result === 1) { // Nomor sudah terdaftar, bisa lanjut lupa PIN
          router.push({
            pathname: "/screens/otpLogin",
            params: { whatsapp, selectedCode, option: 2 },
          });
          onClose();
        } else {
          setError("Nomor WhatsApp tidak ditemukan.");
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk merender konten modal secara dinamis
  const renderContent = () => {
    switch (type) {
      case "login":
        return (
          <>
            <IconTextInput
              iconName="call-outline"
              placeholder="No. Telepon"
              value={nik}
              onChangeText={setNik}
              keyboardType="numeric"
            />
            {/* Input PIN dengan ikon mata */}
            <View style={styles.passwordContainer}>
              <IconTextInput
                iconName="lock-closed-outline"
                placeholder="PIN"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmit}
              disabled={isLoading}
              style={styles.ctaShadow}
            >
              <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.ctaText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSwitchType("forgotPin")}>
              <Text style={styles.switchText}>Lupa PIN?</Text>
            </TouchableOpacity>
          </>
        );

      case "register":
        return (
          <>
            <IconTextInput
              iconName="grid-outline"
              placeholder="Kode Perusahaan"
              value={kode}
              onChangeText={setKode}
              keyboardType="default"
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmit}
              disabled={isLoading}
              style={styles.ctaShadow}
            >
              <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.ctaText}>Cek Kode</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        );
      
      case "whatsappRegister":
      case "forgotPin":
        return (
          <>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCode}
                onValueChange={(itemValue) => setSelectedCode(itemValue)}
                style={styles.picker}
              >
                {CountryCodes.map((item) => (
                  <Picker.Item
                    key={item.code}
                    label={`${item.flag} ${item.code}`}
                    value={item.code}
                  />
                ))}
              </Picker>
              <IconTextInput
                iconName="logo-whatsapp"
                placeholder="Nomor WhatsApp (e.g., 812...)"
                value={whatsapp}
                onChangeText={setWhatsapp}
                keyboardType="numeric"
                style={{ flex: 1 }}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmit}
              disabled={isLoading}
              style={styles.ctaShadow}
            >
              <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.ctaText}>Lanjutkan</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  // Fungsi untuk mendapatkan judul modal
  const getTitle = () => {
    if (type === "login") return "Login";
    if (type === "register") return "Registrasi";
    if (type === "forgotPin") return "Lupa PIN";
    if (type === "whatsappRegister") return "Verifikasi Nomor";
    return "";
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalBackdrop}
      >
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.modalBackdropFlex}/>
        </TouchableWithoutFeedback>

        <View style={styles.sheetWrapper}>
          <BlurView intensity={28} tint="light" style={styles.sheetBlur}>
            <View style={styles.modalInner}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={22} color="#7b7b7b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{getTitle()}</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {renderContent()}
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdropFlex: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheetWrapper: {
    paddingHorizontal: SIZES.medium,
    paddingBottom: SIZES.large,
  },
  sheetBlur: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    minHeight: "50%",
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  modalContent: {
    display: "none",
  },
  modalHandle: {
    alignSelf: "center",
    width: 60,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#d9d9d9",
    marginBottom: SIZES.medium,
  },
  closeButton: {
    position: "absolute",
    top: SIZES.medium,
    right: SIZES.medium,
  },
  modalTitle: {
    fontSize: SIZES.extraLarge,
    fontFamily: FONTS.bold,
    color: COLORS.black,
    textAlign: "center",
    marginBottom: SIZES.medium,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    marginBottom: SIZES.medium,
    fontSize: SIZES.font,
  },
  switchText: {
    color: "#d5e9ff",
    textAlign: "center",
    fontFamily: FONTS.regular,
    marginTop: SIZES.base,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center'
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.medium,
  },
  picker: {
    width: 130, // Sesuaikan lebar picker
  },
  ctaShadow: {
    marginTop: SIZES.medium,
    borderRadius: 14,
    shadowColor: "#0a3e7a",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
    overflow: "hidden",
  },
  ctaButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#ffffff",
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
  },
  lightButton: {
    borderWidth: 1,
    borderColor: "rgba(15,77,146,0.25)",
  },
  lightText: {
    color: "#0f4d92",
  },
});

export default AuthModal;
