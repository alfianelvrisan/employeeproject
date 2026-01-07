import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function PinLogin() {
  const { whatsapp, kode,option } = useLocalSearchParams(); // Ambil query parameter whatsapp
  const whatsappString = Array.isArray(whatsapp) ? whatsapp[0] : whatsapp;
  const kodeString = Array.isArray(kode) ? kode[0] : kode;
  const optiontring = Array.isArray(option) ? option[0] : option;
  const [pin1, setPin1] = useState<string[]>(["", "", "", "", "", ""]);
  const [pin2, setPin2] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const pin1Refs = useRef<Array<TextInput | null>>([]);
  const pin2Refs = useRef<Array<TextInput | null>>([]);

  const handlePinChange = (
    value: string,
    index: number,
    isPin1: boolean
  ) => {
    const newPin = isPin1 ? [...pin1] : [...pin2];
    newPin[index] = value;
    isPin1 ? setPin1(newPin) : setPin2(newPin);

    // Validasi real-time
    const enteredPin1 = isPin1 ? newPin.join("") : pin1.join("");
    const enteredPin2 = isPin1 ? pin2.join("") : newPin.join("");

    if (enteredPin1.length === 6 && enteredPin2.length === 6) {
      if (enteredPin1 !== enteredPin2) {
        setError("PIN atas dan bawah tidak sama.");
      } else {
        setError(""); // Reset error jika validasi berhasil
      }
    } else {
      setError(""); // Reset error jika panjang PIN belum mencukupi
    }

    if (value && index < 5) {
      const nextInput = isPin1
        ? pin1Refs.current[index + 1]
        : pin2Refs.current[index + 1];
      nextInput?.focus();
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
      await register(whatsappString, enteredPin2, kodeString,optiontring);
    } catch (error) {
      setError("Terjadi kesalahan saat registrasi.");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/update_bglogin3.jpg")}
      style={styles.background}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          title: "PIN",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "800",
          },
          headerStyle: {
            backgroundColor: "transparent", // Pastikan tidak ada warna latar
          },
          headerTitleAlign: "center",
          headerTintColor: "#fff",
        }}
      />
      <View style={styles.container}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.text}>Masukkan PIN Baru:</Text>
        <View style={styles.pinContainer}>
          {pin1.map((digit, index) => (
            <TextInput
              key={`pin1-${index}`}
              ref={(ref) => (pin1Refs.current[index] = ref)}
              style={[
                styles.pinInput,
                error && pin1.join("").length === 6 && styles.errorInput,
              ]}
              keyboardType="numeric"
              maxLength={1}
              secureTextEntry // Input akan berbentuk password
              value={digit}
              onChangeText={(value) => handlePinChange(value, index, true)}
            />
          ))}
        </View>
        <Text style={styles.text}>Konfirmasi PIN:</Text>
        <View style={styles.pinContainer}>
          {pin2.map((digit, index) => (
            <TextInput
              key={`pin2-${index}`}
              ref={(ref) => (pin2Refs.current[index] = ref)}
              style={[
                styles.pinInput,
                error && pin2.join("").length === 6 && styles.errorInput,
              ]}
              keyboardType="numeric"
              maxLength={1}
              secureTextEntry // Input akan berbentuk password
              value={digit}
              onChangeText={(value) => handlePinChange(value, index, false)}
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
          <Text style={styles.submitButtonText}>Registrasi</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  pinInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },
  errorInput: {
    borderColor: "red",
  },
  submitButton: {
    width: "96%",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
