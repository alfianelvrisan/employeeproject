import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ImageBackground,
  Modal,
} from "react-native";
import { Stack } from "expo-router";
import { usePin } from "../../context/PinContext";
import CustomHeaderTransparan from "../../components/CustomHeaderTransparan";

export default function RequirePin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authenticate } = usePin();
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handlePinChange = (value: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < pin.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyPin = async () => {
    const enteredPin = pin.join("");
    if (enteredPin.length !== 6) {
      setModalMessage("PIN harus terdiri dari 6 digit.");
      setShowModal(true);
      return;
    }

    const result = await authenticate(enteredPin);
    if (result === 1) {
      setShowModal(false);
    } else {
      setModalMessage("PIN yang Anda masukkan salah.");
      setShowModal(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <ImageBackground
        source={require("../../assets/images/bg_otp.png")}
        style={styles.background}
      >
        <Stack.Screen
          options={{
            headerShown: false,
            headerTransparent: true,
            title: "PIN",
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: "800",
            },
            headerStyle: {
              backgroundColor: "transparent",
            },
            headerTitleAlign: "center",
            headerTintColor: "#fff",
          }}
        />
        <CustomHeaderTransparan title="PIN"/>
        <View style={styles.container}>
          <Modal
            transparent={true}
            visible={showModal}
            animationType="fade"
            onRequestClose={() => setShowModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalText}>{modalMessage}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Text style={styles.text}>Masukkan PIN Anda</Text>
          <View style={styles.otpContainer}>
            {pin.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handlePinChange(value, index)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyPin}>
            <Text style={styles.verifyButtonText}>Verifikasi PIN</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  return <>{children}</>;
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
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
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
  verifyButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  verifyButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "red",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "red",
    fontSize: 14,
    fontWeight: "bold",
  },
});
