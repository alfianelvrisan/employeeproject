import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useAuth } from "../../context/AuthContext";
import {
  createTopupSavings,
  getTopupSavingsStatus,
} from "../../services/topupSavings";

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

const TopupSavings = () => {
  const { userToken, fetchProfile } = useAuth();
  const { orderId, qrisUrl, status, expiresAt } = useLocalSearchParams<{
    orderId?: string;
    qrisUrl?: string;
    status?: string;
    expiresAt?: string;
  }>();
  const shotRef = useRef<ViewShot | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [topupData, setTopupData] = useState<{
    order_id: string;
    qris_url: string;
    status: string;
    expires_at: string;
  } | null>(null);
  const [countdown, setCountdown] = useState("-");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isDetailOnly = Boolean(orderId && qrisUrl);

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        if (profile?.id) setMemberId(profile.id);
      })
      .catch((error) => console.warn(error.message));
  }, [userToken]);

  useEffect(() => {
    if (orderId && qrisUrl) {
      setTopupData({
        order_id: orderId,
        qris_url: qrisUrl,
        status: status || "PENDING",
        expires_at: expiresAt || "",
      });
    }
  }, [orderId, qrisUrl, status, expiresAt]);

  const handleCreate = async () => {
    if (!memberId || !userToken) {
      Alert.alert("Gagal", "Member belum siap.");
      return;
    }
    const parsedAmount = Number(amount.replace(/\D/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Gagal", "Nominal top up tidak valid.");
      return;
    }
    try {
      setIsCreating(true);
      console.log("[topup] create request", {
        memberId,
        amount: parsedAmount,
        expiryMinutes: 15,
      });
      const res = await createTopupSavings(
        memberId,
        parsedAmount,
        15,
        userToken
      );
      console.log("[topup] create response", res);
      setTopupData({
        order_id: res.order_id,
        qris_url: res.qris_url,
        status: res.status || "PENDING",
        expires_at: res.expires_at || "",
      });
      setShowCreateModal(true);
    } catch (error) {
      console.log("[topup] create error", error);
      Alert.alert("Gagal", "Tidak bisa membuat top up.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!topupData?.order_id || !userToken) return;
    try {
      console.log("[topup] status request", { orderId: topupData.order_id });
      const res = await getTopupSavingsStatus(topupData.order_id, userToken);
      console.log("[topup] status response", res);
      setTopupData((prev) =>
        prev
          ? {
              ...prev,
              status: res?.status || prev.status,
              expires_at: res?.expires_at || prev.expires_at,
            }
          : prev
      );
    } catch (error) {
      console.log("[topup] status error", error);
      Alert.alert("Gagal", "Tidak bisa cek status.");
    }
  };

  const handleShareQr = async () => {
    if (!shotRef.current) return;
    try {
      const uri = await captureRef(shotRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        return;
      }
    } catch (error) {
      Alert.alert("Gagal", "Tidak bisa share QR.");
    }
  };

  useEffect(() => {
    if (!topupData?.expires_at) {
      setCountdown("-");
      return;
    }
    const interval = setInterval(() => {
      const targetMs = Date.parse(topupData.expires_at);
      if (Number.isNaN(targetMs)) {
        setCountdown("-");
        return;
      }
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setCountdown("00:00");
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setCountdown(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [topupData?.expires_at]);

  useEffect(() => {
    if (!topupData?.order_id || !userToken) return;
    const interval = setInterval(async () => {
      try {
        const res = await getTopupSavingsStatus(
          topupData.order_id,
          userToken
        );
        setTopupData((prev) =>
          prev
            ? {
                ...prev,
                status: res?.status || prev.status,
                expires_at: res?.expires_at || prev.expires_at,
              }
            : prev
        );
        const statusValue = String(res?.status || "").toLowerCase();
        if (res?.processed || ["success", "settlement", "paid", "expire", "expired"].includes(statusValue)) {
          if (res?.processed || ["success", "settlement", "paid"].includes(statusValue)) {
            Alert.alert("Berhasil", "Top up saving sudah masuk.", [
              {
                text: "OK",
                onPress: () => {
                  fetchProfile().catch(() => {});
                  router.replace("/");
                },
              },
            ]);
          }
          if (res?.processed) {
            fetchProfile().catch(() => {});
          }
          clearInterval(interval);
        }
      } catch (error) {
        console.warn("Gagal cek status top up:", error);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [topupData?.order_id, userToken]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Top Up Savings",
          headerStyle: { backgroundColor: "#FFF247" },
          headerTitleStyle: { color: "#3a2f00", fontWeight: "700" },
          headerBackTitle: "Back",
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {!isDetailOnly && !topupData?.qris_url && (
          <View style={styles.card}>
            <Text style={styles.title}>Top Up Savings</Text>
            <Text style={styles.subtitle}>
              Isi saldo saving lewat QRIS, cepat dan aman.
            </Text>
            <Text style={styles.label}>Nominal top up</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 50000"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickChip}
                  onPress={() => setAmount(String(value))}
                >
                  <Text style={styles.quickText}>
                    Rp {value.toLocaleString("id-ID")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          <TouchableOpacity
            style={[styles.primaryButton, (isCreating || topupData?.qris_url) && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={isCreating || Boolean(topupData?.qris_url)}
          >
            <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
            <Text style={styles.primaryButtonText}>
              {isCreating ? "Memproses..." : "Buat QRIS"}
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {topupData?.qris_url && (
          <View style={styles.qrisCard}>
            <ViewShot ref={shotRef} style={styles.qrisShot}>
              <Text style={styles.qrisOrderId}>
                Order ID: {topupData.order_id}
              </Text>
              <Image source={{ uri: topupData.qris_url }} style={styles.qrisImage} />
              <Text style={styles.qrisStatus}>
                Status: {topupData.status || "PENDING"}
              </Text>
              <Text style={styles.qrisTimer}>Sisa waktu: {countdown}</Text>
              <Text style={styles.qrisExpiry}>
                Expired:{" "}
                {topupData.expires_at
                  ? new Date(topupData.expires_at).toLocaleString("id-ID", {
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
              <TouchableOpacity style={styles.primaryButton} onPress={handleShareQr}>
                <Ionicons name="download-outline" size={18} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Simpan QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCheckStatus}>
                <Ionicons name="refresh" size={18} color="#3a2f00" />
                <Text style={styles.secondaryButtonText}>Cek Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      <Modal
        transparent
        visible={showCreateModal}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark" size={26} color="#ffffff" />
            </View>
            <Text style={styles.modalTitle}>QRIS Berhasil Dibuat</Text>
            <Text style={styles.modalSubtitle}>
              Scan QRIS untuk top up saving. Status akan otomatis dicek.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalPrimary}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalPrimaryText}>Lihat QRIS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSecondary}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalSecondaryText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {isCreating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e21864" />
          <Text style={styles.loadingText}>Membuat QRIS...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff9db",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3a2f00",
  },
  subtitle: {
    fontSize: 12,
    color: "#7a5c00",
    marginTop: 4,
  },
  label: {
    marginTop: 16,
    fontSize: 12,
    color: "#7a5c00",
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#f1d18a",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#3a2f00",
    backgroundColor: "#fff6d6",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    backgroundColor: "#fff6d6",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#f1d18a",
  },
  quickText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b3a00",
  },
  primaryButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#e21864",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#fff6d6",
    borderWidth: 1,
    borderColor: "#f1d18a",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3a2f00",
  },
  qrisCard: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  qrisShot: {
    alignItems: "center",
    paddingVertical: 6,
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
    marginTop: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3a2f00",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1b8f3a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a2f00",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#7a5c00",
    textAlign: "center",
    marginTop: 6,
  },
  modalActions: {
    width: "100%",
    marginTop: 16,
    gap: 10,
  },
  modalPrimary: {
    backgroundColor: "#e21864",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  modalSecondary: {
    backgroundColor: "#fff6d6",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1d18a",
  },
  modalSecondaryText: {
    color: "#3a2f00",
    fontWeight: "700",
    fontSize: 13,
  },
});

export default TopupSavings;
