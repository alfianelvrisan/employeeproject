import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  AppState,
  AppStateStatus,
  ImageBackground,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function OtpLogin() {
  const { whatsapp, kode, selectedCode,option } = useLocalSearchParams();
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [timer, setTimer] = useState<number>(120); // 2 menit
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const appState = useRef(AppState.currentState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveTime = useRef<number | null>(null);

  const fullPhone =
    selectedCode && whatsapp
      ? `${(typeof selectedCode === "string"
          ? selectedCode.replace("+", "")
          : "")}${(whatsapp as string).replace(/\D/g, "")}`
      : "";

  useEffect(() => {
    generateAndSendOtp(); // Jalankan fungsi generateAndSendOtp saat file dimuat
    startTimer(); // Mulai timer

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
      // Aplikasi masuk ke background
      lastActiveTime.current = Date.now();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      // Aplikasi kembali ke foreground
      if (lastActiveTime.current) {
        const timeElapsed = Math.floor((Date.now() - lastActiveTime.current) / 1000);
        setTimer((prev) => Math.max(prev - timeElapsed, 0));
        if (timer > 0) {
          startTimer();
        } else {
          setIsResendDisabled(false);
        }
      }
    }
    appState.current = nextAppState;
  };

  const generateAndSendOtp = async () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6 digit OTP
    setGeneratedOtp(newOtp);

    try {
      if (!whatsapp) {
        Alert.alert("Gagal", "Nomor WhatsApp tidak ditemukan.");
        return;
      }

      const phone = (whatsapp as string).replace(/\D/g, "");
      const countryCode =
        typeof selectedCode === "string" ? selectedCode.replace("+", "") : ""; // hasil: '62'
      const fullPhone = `${countryCode}${phone}`;

      const formBody = new URLSearchParams({
        token: "wnp3ph9bmbbs6ua2",
        to: fullPhone,
        body: `
        Kode OTP Anda untuk mengakses layanan resmi Laskar Buah 
        Indonesia adalah ${newOtp}. Demi menjaga keamanan dan kerahasiaan 
        akun Anda, mohon untuk tidak membagikan kode ini kepada siapa pun,
        termasuk kepada pihak yang mengaku dari Laskar Buah Indonesia. Kami 
        tidak pernah meminta kode OTP dalam bentuk 
        apa pun. Lindungi data pribadi Anda dari penyalahgunaan `,
      });

      const response = await fetch(
        "https://api.ultramsg.com/instance110187/messages/chat?token=wnp3ph9bmbbs6ua2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formBody.toString(),
        }
      );

      const responseText = await response.text();
      console.log("API Response Text:", responseText);

      if (!response.ok) {
        throw new Error(responseText);
      }

      Alert.alert("Sukses", "Kode OTP berhasil dikirim ke WhatsApp Anda.");
    } catch (error) {
      console.error("Error mengirim OTP:", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat mengirim OTP.");
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimer(120); // Reset timer ke 120 detik
    setIsResendDisabled(true);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (timer === 0) {
      Alert.alert("Gagal", "Waktu telah habis. Silakan kirim ulang OTP.");
      return;
    }

    const enteredOtp = otp.join("");
    if (enteredOtp === generatedOtp) {
      setOtp(["", "", "", "", "", ""]);
      router.push({
        pathname: "/(auth)/pin",
        params: { whatsapp: whatsapp, kode: kode, option: option },
      });
    } else {
      Alert.alert("Gagal", "OTP yang Anda masukkan salah.");
    }
  };

  const handleResendOtp = async () => {
    generateAndSendOtp(); // Kirim ulang OTP
    startTimer(); // Mulai ulang timer
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
          title: "Otp",
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
        <Text style={styles.text}>Masukkan OTP yang dikirim ke WhatsApp:</Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp}>
          <Text style={styles.verifyButtonText}>Verifikasi OTP</Text>
        </TouchableOpacity>
        <Text style={styles.timerText}>
          {isResendDisabled
            ? `Kirim ulang OTP dalam ${timer} detik`
            : "Anda dapat mengirim ulang OTP sekarang"}
        </Text>
        <TouchableOpacity
          style={[
            styles.resendButton,
            isResendDisabled && styles.resendButtonDisabled,
          ]}
          onPress={handleResendOtp}
          disabled={isResendDisabled}
        >
          <Text style={styles.resendButtonText}>Kirim Ulang OTP</Text>
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
  timerText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 10,
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  resendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
