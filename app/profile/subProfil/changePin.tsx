import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import RequirePin from "../../middleware/requirePin";
import { PinProvider } from "../../../context/PinContext";
import CustomHeader from "../../../components/CustomHeader";
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function PinLogin() {
  const { whatsapp, kode, option } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const whatsappString = Array.isArray(whatsapp) ? whatsapp[0] : whatsapp ?? "";
  const formattedWhatsapp = whatsappString.replace(/^0/, "");

  const kodeString = Array.isArray(kode) ? kode[0] : kode ?? "";
  const optiontring = "2";
  const [pin1, setPin1] = useState<string[]>(["", "", "", "", "", ""]);
  const [pin2, setPin2] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const pin1Refs = useRef<Array<TextInput | null>>([]);
  const pin2Refs = useRef<Array<TextInput | null>>([]);

  const handlePinChange = (value: string, index: number, isPin1: boolean) => {
    const newPin = isPin1 ? [...pin1] : [...pin2];
    newPin[index] = value;
    isPin1 ? setPin1(newPin) : setPin2(newPin);

    const enteredPin1 = isPin1 ? newPin.join("") : pin1.join("");
    const enteredPin2 = isPin1 ? pin2.join("") : newPin.join("");

    if (enteredPin1.length === 6 && enteredPin2.length === 6) {
      if (enteredPin1 !== enteredPin2) {
        setError("PIN atas dan bawah tidak sama.");
      } else {
        setError("");
      }
    } else {
      setError("");
    }

    if (value && index < 5) {
      const nextInput = isPin1
        ? pin1Refs.current[index + 1]
        : pin2Refs.current[index + 1];
      nextInput?.focus();
    }
  };

  const handlePinBackspace = (index: number, isPin1: boolean) => {
    const current = isPin1 ? pin1[index] : pin2[index];
    if (current !== "") {
      return;
    }
    const prevIndex = index - 1;
    if (prevIndex < 0) return;
    if (isPin1) {
      const updated = [...pin1];
      updated[prevIndex] = "";
      setPin1(updated);
      pin1Refs.current[prevIndex]?.focus();
    } else {
      const updated = [...pin2];
      updated[prevIndex] = "";
      setPin2(updated);
      pin2Refs.current[prevIndex]?.focus();
    }
  };

  const handleRegister = async () => {
    const enteredPin1 = pin1.join("");
    const enteredPin2 = pin2.join("");

    if (enteredPin1.length !== 6 || enteredPin2.length !== 6) {
      setError("PIN harus terdiri dari 6 digit.");
      return;
    }

    if (enteredPin1 !== enteredPin2) {
      setError("PIN atas dan bawah tidak sama.");
      return;
    }

    try {
      await register(formattedWhatsapp, enteredPin2, kodeString, optiontring);
    } catch (error) {
      setError("Terjadi kesalahan saat registrasi.");
    }
  };

  return (
    <SafeAreaProvider>
      <PinProvider>
        <RequirePin>
          <Stack.Screen
            options={{
              headerShown: false,
              headerTitle: "PIN",
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: "#fff",
              },
              headerTintColor: "#115f9f",
            }}
          />
          <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
              <CustomHeader title="Ganti PIN" variant="accent" />
            </View>
            <Text style={styles.sectionTitle}>Keamanan Akun</Text>
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="lock-closed" size={18} color={PALETTE.icon} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Ubah PIN</Text>
                  <Text style={styles.cardSub}>
                    Gunakan 6 digit angka dan jangan dibagikan ke siapa pun.
                  </Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={styles.labelRow}>
                <Text style={styles.text}>Masukkan PIN Baru</Text>
                <Text style={styles.helperText}>6 digit</Text>
              </View>
              <View style={styles.pinContainer}>
                {pin1.map((digit, index) => (
                  <TextInput
                    key={`pin1-${index}`}
                    ref={(ref) => {
                      pin1Refs.current[index] = ref;
                    }}
                    style={[
                      styles.pinInput,
                      error && pin1.join("").length === 6 && styles.errorInput,
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    secureTextEntry
                    value={digit}
                    onChangeText={(value) =>
                      handlePinChange(value, index, true)
                    }
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === "Backspace") {
                        handlePinBackspace(index, true);
                      }
                    }}
                  />
                ))}
              </View>
              <View style={styles.labelRow}>
                <Text style={styles.text}>Konfirmasi PIN</Text>
                <Text style={styles.helperText}>Ulangi PIN</Text>
              </View>
              <View style={styles.pinContainer}>
                {pin2.map((digit, index) => (
                  <TextInput
                    key={`pin2-${index}`}
                    ref={(ref) => {
                      pin2Refs.current[index] = ref;
                    }}
                    style={[
                      styles.pinInput,
                      error && pin2.join("").length === 6 && styles.errorInput,
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    secureTextEntry
                    value={digit}
                    onChangeText={(value) =>
                      handlePinChange(value, index, false)
                    }
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === "Backspace") {
                        handlePinBackspace(index, false);
                      }
                    }}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  error ? styles.submitButtonDisabled : null,
                ]}
                disabled={!!error}
                onPress={handleRegister}
              >
                <Text style={styles.submitButtonText}>Simpan PIN</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </RequirePin>
      </PinProvider>
    </SafeAreaProvider>
  );
}

const PALETTE = {
  background: "#fffdf5",
  card: "#ffffff",
  border: "#efe7c4",
  accent: "#fff247",
  accentSoft: "#fff8d7",
  textPrimary: "#3a2f00",
  textMuted: "#6f5a1a",
  icon: "#b08d00",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  headerWrap: {
    backgroundColor: PALETTE.accent,
  },
  sectionTitle: {
    marginTop: 20,
    marginHorizontal: 20,
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionCard: {
    margin: 20,
    marginTop: 10,
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: "rgba(58,47,0,0.08)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PALETTE.textPrimary,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 12,
    color: PALETTE.textMuted,
    lineHeight: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    color: PALETTE.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: PALETTE.textMuted,
  },
  errorText: {
    color: "#c0392b",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    backgroundColor: "#fff1f0",
    paddingVertical: 6,
    borderRadius: 8,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 8,
  },
  pinInput: {
    width: 46,
    height: 52,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 18,
    backgroundColor: PALETTE.accentSoft,
    color: PALETTE.textPrimary,
  },
  errorInput: {
    borderColor: "red",
  },
  submitButton: {
    width: "100%",
    backgroundColor: PALETTE.accent,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#e5e1ce",
  },
  submitButtonText: {
    color: PALETTE.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
