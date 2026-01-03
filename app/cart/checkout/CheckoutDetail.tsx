import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import WebView from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useAuth } from "../../../context/AuthContext";
import { getQrisStatusByOrderId } from "../../../services/qris";

const CheckoutDetail = () => {
  const { redirectUrl, qrisUrl, orderId, status, expiresAt, salesId } =
    useLocalSearchParams() as {
      redirectUrl?: string;
      qrisUrl?: string;
      orderId?: string;
      status?: string;
      expiresAt?: string;
      salesId?: string;
    };
  const [loading, setLoading] = useState(true);
  const [qrisStatus, setQrisStatus] = useState(status || "PENDING");
  const [qrisExpiresAt, setQrisExpiresAt] = useState(expiresAt || "");
  const [countdown, setCountdown] = useState("-");
  const [isPaid, setIsPaid] = useState(false);
  const shotRef = useRef<ViewShot | null>(null);
  const { userToken } = useAuth();

  const fetchQrisStatus = async () => {
    if (!userToken) return null;
    if (orderId) {
      return getQrisStatusByOrderId(orderId, String(userToken));
    }
    return null;
  };

  useEffect(() => {
    if (!userToken || !qrisUrl) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetchQrisStatus();
        if (res?.status) setQrisStatus(res.status);
        if (res?.expires_at) setQrisExpiresAt(res.expires_at);
        const normalizedStatus = String(
          res?.status || res?.midtrans_status || ""
        ).toLowerCase();
        const paid =
          res?.paid_processed === true ||
          ["success", "settlement", "paid", "capture"].includes(
            normalizedStatus
          );
        if (paid) {
          setIsPaid(true);
          clearInterval(interval);
        }
      } catch (error) {
        console.warn("Gagal cek status QRIS:", error);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [orderId, salesId, userToken, qrisUrl]);

  useEffect(() => {
    if (!qrisExpiresAt) {
      setCountdown("-");
      return;
    }
    const targetMs = Date.parse(qrisExpiresAt);
    if (Number.isNaN(targetMs)) {
      setCountdown("-");
      return;
    }
    const interval = setInterval(() => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setCountdown("00:00");
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const mm = String(minutes).padStart(2, "0");
      const ss = String(seconds).padStart(2, "0");
      setCountdown(`${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [qrisExpiresAt]);

  const handleSaveQr = async () => {
    try {
      if (!shotRef.current) return;
      const uri = await captureRef(shotRef, {
        format: "png",
        quality: 1,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Gagal", "Tidak bisa menyimpan QR saat ini.");
    }
  };

  const handleRefreshStatus = async () => {
    if (!userToken) return;
    try {
      const res = await fetchQrisStatus();
      if (res?.status) setQrisStatus(res.status);
      if (res?.expires_at) setQrisExpiresAt(res.expires_at);
      const normalizedStatus = String(
        res?.status || res?.midtrans_status || ""
      ).toLowerCase();
      const paid =
        res?.paid_processed === true ||
        ["success", "settlement", "paid", "capture"].includes(normalizedStatus);
      setIsPaid(paid);
    } catch (error) {
      Alert.alert("Gagal", "Tidak bisa cek status pembayaran.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          headerTransparent: false,
        }}
      />
      {qrisUrl ? (
        <>
          <View style={styles.qrisHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#3a2f00" />
            </TouchableOpacity>
            <Text style={styles.qrisTitle}>Pembayaran QRIS</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ViewShot ref={shotRef} style={styles.qrisCard}>
            <Text style={styles.qrisOrderId}>Order ID: {orderId || "-"}</Text>
            <Image source={{ uri: qrisUrl }} style={styles.qrisImage} />
            <Text style={styles.qrisStatus}>Status: {qrisStatus}</Text>
            <Text style={styles.qrisTimer}>Sisa waktu: {countdown}</Text>
            <Text style={styles.qrisExpiry}>
              Expired:{" "}
              {qrisExpiresAt
                ? new Date(qrisExpiresAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </Text>
          </ViewShot>
          <View style={styles.qrisActions}>
            <TouchableOpacity
              onPress={handleSaveQr}
              style={styles.actionButton}
            >
              <Ionicons name="download-outline" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Simpan QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefreshStatus}
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <Ionicons name="refresh" size={18} color="#3a2f00" />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Cek Status
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#115f9f" />
              <Text style={styles.loadingText}>Loading Payment Page...</Text>
            </View>
          )}
          <WebView
            source={{ uri: redirectUrl || "https://your-default-payment-url.com" }}
            onLoadEnd={() => setLoading(false)}
            style={styles.webView}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  webView: {
    flex: 1,
    // marginTop: 130, // Ensure the WebView starts below the header
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    // marginBottom: 100,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff6d6",
    alignItems: "center",
    justifyContent: "center",
  },
  qrisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    backgroundColor: "#fff",
  },
  qrisTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a2f00",
  },
  headerSpacer: {
    width: 36,
  },
  qrisCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  qrisOrderId: {
    fontSize: 12,
    color: "#7a7a7a",
    marginBottom: 10,
  },
  qrisImage: {
    width: 240,
    height: 240,
    resizeMode: "contain",
    marginBottom: 12,
  },
  qrisStatus: {
    fontSize: 13,
    fontWeight: "700",
    color: "#de0866",
    marginBottom: 4,
  },
  qrisTimer: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3a2f00",
    marginBottom: 4,
  },
  qrisExpiry: {
    fontSize: 12,
    color: "#7a7a7a",
  },
  qrisActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#e21864",
    borderWidth: 1,
    borderColor: "#f05b95",
    shadowColor: "#e21864",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: "#fff7e1",
    borderColor: "#f1d18a",
    shadowColor: "#d2a24f",
    shadowOpacity: 0.12,
  },
  secondaryButtonText: {
    color: "#3a2f00",
  },
});

export default CheckoutDetail;
