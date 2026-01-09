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
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../context/AuthContext";
import { COLORS, SIZES, FONTS } from "../constants/theme";
import IconTextInput from "./IconTextInput";

const illustrationSource = require("../assets/images/employee1.png");
const illustrationMeta = Image.resolveAssetSource(illustrationSource);
const illustrationAspectRatio =
  illustrationMeta && illustrationMeta.width && illustrationMeta.height
    ? illustrationMeta.width / illustrationMeta.height
    : 1;
const ILLUSTRATION_WIDTH = 300;
const illustrationSize = {
  width: ILLUSTRATION_WIDTH,
  height: ILLUSTRATION_WIDTH / illustrationAspectRatio,
};

const AuthModal = ({ visible, type, onClose, onSwitchType }) => {
  const { login, refreshSession, changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrik");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricHasToken, setBiometricHasToken] = useState(false);

  const isLoginView = type !== "changePassword";
  const brandGradient = ["#ffea00", "#ffc400", "#ff9100"];
  const isIOS = Platform.OS === "ios";

  useEffect(() => {
    if (!visible) {
      setError("");
      setSuccess("");
      setIsLoading(false);
      setIsBiometricLoading(false);
      setNik("");
      setPassword("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordVisible(false);
    }
  }, [visible]);

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [type]);

  useEffect(() => {
    if (!visible) return;
    let isActive = true;

    const checkBiometric = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        let label = "Biometrik";
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          label = "Face ID";
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          label = "Fingerprint";
        }
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!isActive) return;
        setBiometricLabel(label);
        setBiometricAvailable(hasHardware && isEnrolled);
        setBiometricHasToken(Boolean(refreshToken));
      } catch {
        if (!isActive) return;
        setBiometricAvailable(false);
        setBiometricHasToken(false);
      }
    };

    checkBiometric();
    return () => {
      isActive = false;
    };
  }, [visible]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLoginView) {
        if (!nik || !password) {
          throw new Error("NIK dan password wajib diisi.");
        }
        await login(nik, password);
        onClose();
      } else {
        if (!nik || !currentPassword || !newPassword || !confirmPassword) {
          throw new Error("Lengkapi semua field.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Konfirmasi password tidak sama.");
        }
        await changePassword(nik, currentPassword, newPassword);
        setSuccess("Password berhasil diubah. Silakan login.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable) return;
    if (!biometricHasToken) {
      setError("Belum ada sesi tersimpan untuk login biometrik.");
      return;
    }

    setIsBiometricLoading(true);
    setError("");

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Masuk dengan ${biometricLabel}`,
        cancelLabel: "Batal",
        fallbackLabel: "Gunakan password",
      });

      if (!result.success) {
        throw new Error("Autentikasi dibatalkan.");
      }

      await refreshSession();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const biometricButtonVisible =
    isLoginView && biometricAvailable && biometricHasToken;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={isIOS ? "padding" : "height"}
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
              {isLoginView ? (
                <Image
                  source={illustrationSource}
                  style={[styles.modalIllustration, illustrationSize]}
                  pointerEvents="none"
                />
              ) : null}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#6f5b00" />
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? (
                <Text style={styles.successText}>{success}</Text>
              ) : null}

              <View style={styles.formContainer}>
                {isLoginView ? (
                  <>
                    <View style={styles.header}>
                    </View>
                    <IconTextInput
                      iconName="card-outline"
                      iconSize={26}
                      containerStyle={styles.authInput}
                      inputStyle={styles.authInputText}
                      placeholder="NIK"
                      value={nik}
                      onChangeText={setNik}
                      keyboardType="numeric"
                    />
                    <View style={styles.passwordContainer}>
                      <IconTextInput
                        iconName="lock-closed-outline"
                        iconSize={26}
                        containerStyle={styles.authInput}
                        inputStyle={styles.authInputText}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        <Ionicons
                          name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                          size={22}
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
                      <LinearGradient
                        colors={brandGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaButton}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text style={styles.ctaText}>Login</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    {biometricButtonVisible ? (
                      <TouchableOpacity
                        style={styles.biometricButton}
                        onPress={handleBiometricLogin}
                        disabled={isBiometricLoading}
                      >
                        {isBiometricLoading ? (
                          <ActivityIndicator color="#3a2f00" />
                        ) : (
                          <>
                            <Ionicons
                              name="scan-outline"
                              size={20}
                              color="#3a2f00"
                            />
                            <Text style={styles.biometricText}>
                              Masuk dengan {biometricLabel}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => onSwitchType("changePassword")}
                      style={styles.linkButton}
                    >
                      <Text style={styles.linkText}>Ubah Password</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.header}>
                      <Text style={styles.title}>Ubah Password</Text>
                      <Text style={styles.subtitle}>
                        Masukkan NIK dan password baru Anda.
                      </Text>
                    </View>
                    <IconTextInput
                      iconName="card-outline"
                      iconSize={26}
                      containerStyle={styles.authInput}
                      inputStyle={styles.authInputText}
                      placeholder="NIK"
                      value={nik}
                      onChangeText={setNik}
                      keyboardType="numeric"
                    />
                    <IconTextInput
                      iconName="lock-closed-outline"
                      iconSize={26}
                      containerStyle={styles.authInput}
                      inputStyle={styles.authInputText}
                      placeholder="Password lama"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    <IconTextInput
                      iconName="lock-closed-outline"
                      iconSize={26}
                      containerStyle={styles.authInput}
                      inputStyle={styles.authInputText}
                      placeholder="Password baru"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    <IconTextInput
                      iconName="shield-checkmark-outline"
                      iconSize={26}
                      containerStyle={styles.authInput}
                      inputStyle={styles.authInputText}
                      placeholder="Konfirmasi password baru"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      style={styles.ctaShadow}
                    >
                      <LinearGradient
                        colors={brandGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaButton}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text style={styles.ctaText}>Simpan</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onSwitchType("login")}
                      style={styles.linkButton}
                    >
                      <Text style={styles.linkText}>Kembali ke Login</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFDE6A",
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "stretch",
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  modalContent: {
    width: "100%",
    maxWidth: "100%",
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: SIZES.large,
    paddingTop: SIZES.extraLarge * 1.6,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,222,106,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalIllustration: {
    position: "absolute",
    top: -270,
    resizeMode: "contain",
    alignSelf: "center",
    zIndex: 1,
  },
  header: {
    marginBottom: SIZES.medium,
  },
  title: {
    fontSize: 22,
    color: "#3a2f00",
    fontFamily: FONTS.bold,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(58,47,0,0.6)",
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    marginBottom: SIZES.medium,
    fontSize: SIZES.font,
  },
  successText: {
    color: "#1b7f37",
    textAlign: "center",
    marginBottom: SIZES.medium,
    fontSize: SIZES.font,
  },
  formContainer: {
    marginTop: SIZES.base,
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 14,
  },
  ctaText: {
    color: "#ffffff",
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
  },
  biometricButton: {
    marginTop: SIZES.base,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(122,92,0,0.2)",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  biometricText: {
    color: "#3a2f00",
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  linkButton: {
    marginTop: SIZES.small,
    alignSelf: "center",
  },
  linkText: {
    color: "#7b5a00",
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  authInput: {
    borderRadius: 18,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: "rgba(122,92,0,0.18)",
  },
  authInputText: {
    fontSize: 15,
  },
});

export default AuthModal;
