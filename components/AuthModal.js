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
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext"; // Sesuaikan path jika perlu
import { LinearGradient } from "expo-linear-gradient";

// Import komponen & tema
import { COLORS, SIZES, FONTS } from "../constants/theme";
import IconTextInput from "./IconTextInput";

// Data Kode Negara (bisa dipindah ke file constants terpisah)
const CountryCodes = [
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  // ...tambahkan sisa kode negara dari kode lama Anda
];

const illustrationSource = require("../assets/images/employee1.png");
const illustrationMeta = Image.resolveAssetSource(illustrationSource);
const illustrationAspectRatio =
  illustrationMeta && illustrationMeta.width && illustrationMeta.height
    ? illustrationMeta.width / illustrationMeta.height
    : 1;
const ILLUSTRATION_WIDTH = 290;
const illustrationSize = {
  width: ILLUSTRATION_WIDTH,
  height: ILLUSTRATION_WIDTH / illustrationAspectRatio,
};

const AuthModal = ({ visible, type, onClose, onSwitchType }) => {
  const { login, cekode, cekwhastapp, register } = useAuth();
  const brandGradient = ["#ffea00", "#ffc400", "#ff9100"];
  const softGradient = ["#fff7c2", "#ffd85f", "#ff9f1c"];

  // State Internal Modal
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State untuk form
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [kode, setKode] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [registerPin, setRegisterPin] = useState("");
  const [selectedCode, setSelectedCode] = useState("+62");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showKodeHelp, setShowKodeHelp] = useState(false);

  // Membersihkan state setiap kali modal ditutup
  useEffect(() => {
    if (!visible) {
      setError("");
      setIsLoading(false);
      setNik("");
      setPassword("");
      setKode("");
      setWhatsapp("");
      setRegisterPin("");
      setShowKodeHelp(false);
    }
  }, [visible]);

  // Handler utama untuk submit
  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (type === "login") {
        await login(nik, password);
        onClose(); // Tutup modal
      } 
      else if (type === "register") {
        const result = await cekode(kode);
        if (result === 1) {
          onSwitchType("directRegister");
        } else {
          setError("Kode Perusahaan tidak valid atau terjadi kesalahan.");
        }
      } 
      else if (type === "directRegister") {
        const normalizedPhone = whatsapp.replace(/\D/g, "").replace(/^0/, "");
        if (!normalizedPhone) {
          setError("Nomor telepon wajib diisi.");
          return;
        }
        if (registerPin.length !== 6) {
          setError("PIN harus 6 digit.");
          return;
        }
        await register(normalizedPhone, registerPin, kode, "1");
        onClose();
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
                  color={COLORS.black}
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
            <View style={styles.kodeRow}>
              <View style={styles.kodeInput}>
                <IconTextInput
                  iconName="grid-outline"
                  placeholder="Kode Perusahaan"
                  value={kode}
                  onChangeText={setKode}
                  keyboardType="default"
                />
              </View>
              <View style={styles.helpAnchor}>
                <TouchableOpacity
                  style={styles.helpButton}
                  onPress={() => setShowKodeHelp((prev) => !prev)}
                >
                  <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                {showKodeHelp ? (
                  <View style={styles.helpBubbleFloating}>
                    <View style={styles.helpBubbleArrow} />
                    <Text style={styles.helpText}>
                      Kode didapat dari struk belanja jika total belanja lebih dari Rp 50.000.
                    </Text>
                  </View>
                ) : null}
              </View>
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
      case "directRegister":
        return (
          <>
            <IconTextInput
              iconName="call-outline"
              placeholder="No. Telepon (contoh: 812...)"
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="numeric"
            />
            <IconTextInput
              iconName="lock-closed-outline"
              placeholder="PIN (6 digit)"
              value={registerPin}
              onChangeText={setRegisterPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
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
                  <Text style={styles.ctaText}>Daftar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
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
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        >
          <View style={styles.modalBackdropFlex} />
        </TouchableWithoutFeedback>
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalContent}>
              {type === "login" ? (
                <Image
                  source={illustrationSource}
                  style={[styles.modalIllustration, illustrationSize]}
                  pointerEvents="none"
                />
              ) : null}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={22} color="#7b7b7b" />
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.formContainer}>{renderContent()}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    position: "relative",
  },
  modalBackdropFlex: {
    flex: 1,
    backgroundColor: "#FFDE6A",
  },
  centerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "stretch",
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  modalContent: {
    width: "100%",
    maxWidth: "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: SIZES.large,
    paddingTop: SIZES.large * 1.2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "visible",
    shadowColor: "#0a3e7a",
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 24 },
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
  closeButton: {
    position: "absolute",
    top: SIZES.medium,
    right: SIZES.medium,
    zIndex: 2,
  },
  modalIllustration: {
    position: "absolute",
    top: -180,
    resizeMode: "contain",
    alignSelf: "center",
    zIndex: 1,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    marginBottom: SIZES.medium,
    fontSize: SIZES.font,
  },
  formContainer: {
    marginTop: SIZES.medium,
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
  kodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kodeInput: {
    flex: 1,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 201, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  helpAnchor: {
    position: "relative",
    height: 50,
    marginBottom: SIZES.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  helpBubbleFloating: {
    position: "absolute",
    right: 0,
    bottom: 52,
    minWidth: 210,
    maxWidth: 250,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 12,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 201, 0, 0.45)",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  helpBubbleArrow: {
    position: "absolute",
    right: 16,
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 201, 0, 0.45)",
    transform: [{ rotate: "45deg" }],
  },
  helpText: {
    color: COLORS.black,
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
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
