import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
import { Stack, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../context/AuthContext";
import {
  getTopupSavingsByMember,
  getTopupSavingsStatus,
} from "../../services/topupSavings";

const TopupHistory = () => {
  const { userToken, fetchProfile } = useAuth();
  const [memberId, setMemberId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        if (profile?.id) setMemberId(profile.id);
      })
      .catch((error) => console.warn(error.message));
  }, [userToken]);

  const fetchHistory = useCallback(async () => {
    if (!userToken || !memberId) {
      setHistory([]);
      return;
    }
    try {
      const res = await getTopupSavingsByMember(memberId, userToken);
      const list = Array.isArray(res) ? res : res?.data || [];
      const finalList = Array.isArray(list) ? list : [];
      setHistory(finalList);
      setPage(1);
    } catch (error) {
      console.warn("Gagal ambil riwayat top up:", error);
      setHistory([]);
    }
  }, [memberId, userToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!userToken || history.length === 0) return;
    const pendingItems = history.filter(
      (item) => String(item.status || "").toUpperCase() === "PENDING"
    );
    if (pendingItems.length === 0) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(async () => {
      try {
        const updates = await Promise.all(
          pendingItems.map(async (item) => {
            try {
              const res = await getTopupSavingsStatus(item.order_id, userToken);
              return {
                order_id: item.order_id,
                status: res?.status || item.status,
                expires_at: res?.expires_at || item.expires_at,
                processed: res?.processed ?? item.processed,
              };
            } catch (error) {
              return null;
            }
          })
        );
        const updateMap = new Map(
          updates.filter(Boolean).map((u: any) => [u.order_id, u])
        );
        setHistory((prev) =>
          prev.map((item) => updateMap.get(item.order_id) || item)
        );
      } catch (error) {
        console.warn("Gagal polling status top up:", error);
      }
    }, 3000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [history, userToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const handleCheckStatus = async (orderId: string) => {
    if (!userToken) return;
    try {
      const res = await getTopupSavingsStatus(orderId, userToken);
      setHistory((prev) =>
        prev.map((item) =>
          item.order_id === orderId
            ? {
                ...item,
                status: res?.status || item.status,
                expires_at: res?.expires_at || item.expires_at,
                processed: res?.processed ?? item.processed,
              }
            : item
        )
      );
      if (res?.processed) {
        fetchProfile().catch(() => {});
      }
    } catch (error) {
      console.warn("Gagal cek status top up:", error);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = String(item.status || "PENDING").toUpperCase();
    const statusColor =
      status === "EXPIRE" || status === "EXPIRED"
        ? styles.statusExpired
        : status === "PENDING"
          ? styles.statusPending
          : styles.statusSuccess;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setSelectedItem(item);
          setDetailVisible(true);
        }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Top Up Savings</Text>
          <View style={[styles.statusPill, statusColor]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>{item.order_id || "-"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nominal</Text>
          <Text style={styles.value}>
            Rp {Number(item.amount || 0).toLocaleString("id-ID")}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Expired</Text>
          <Text style={styles.value}>
            {item.expires_at
              ? new Date(item.expires_at).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </Text>
        </View>
        {status === "PENDING" && item.qris_url && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: "/topup/TopupSavings",
                  params: {
                    orderId: item.order_id,
                    qrisUrl: item.qris_url,
                    status: item.status,
                    expiresAt: item.expires_at,
                  },
                })
              }
            >
              <Ionicons name="qr-code-outline" size={16} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Detail QRIS</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Riwayat Top Up",
          headerStyle: { backgroundColor: "#FFF247" },
          headerTitleStyle: { color: "#3a2f00", fontWeight: "700" },
          headerBackTitle: "Back",
        }}
      />
      <FlatList
        data={history.slice(0, page * pageSize)}
        keyExtractor={(item, index) => `${item.order_id || index}`}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Belum ada top up.</Text>
        }
        ListFooterComponent={
          history.length > page * pageSize ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setPage((prev) => prev + 1)}
            >
              <Text style={styles.loadMoreText}>Muat lebih banyak</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <Modal
        transparent
        visible={detailVisible}
        animationType="slide"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setDetailVisible(false)}
          />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Detail Top Up</Text>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Order ID</Text>
              <Text style={styles.sheetValue}>
                {selectedItem?.order_id || "-"}
              </Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Nominal</Text>
              <Text style={styles.sheetValue}>
                Rp{" "}
                {Number(selectedItem?.amount || 0).toLocaleString("id-ID")}
              </Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Status</Text>
              <Text style={styles.sheetValue}>
                {selectedItem?.status || "-"}
              </Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Created</Text>
              <Text style={styles.sheetValue}>
                {selectedItem?.created_at
                  ? new Date(selectedItem.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Expired</Text>
              <Text style={styles.sheetValue}>
                {selectedItem?.expires_at
                  ? new Date(selectedItem.expires_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => setDetailVisible(false)}
            >
              <Text style={styles.sheetCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff9db",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a2f00",
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  statusExpired: {
    backgroundColor: "#d7263d",
  },
  statusPending: {
    backgroundColor: "#f4b400",
  },
  statusSuccess: {
    backgroundColor: "#1b8f3a",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: "#7a5c00",
  },
  value: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3a2f00",
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#e21864",
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#fff6d6",
    borderWidth: 1,
    borderColor: "#f1d18a",
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3a2f00",
  },
  emptyText: {
    textAlign: "center",
    color: "#8a8a8a",
    marginTop: 40,
  },
  loadMoreButton: {
    marginTop: 12,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#fff6d6",
    borderWidth: 1,
    borderColor: "#f1d18a",
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b3a00",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d7d7d7",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a2f00",
    marginBottom: 10,
  },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetLabel: {
    fontSize: 12,
    color: "#7a5c00",
  },
  sheetValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3a2f00",
  },
  sheetClose: {
    marginTop: 10,
    backgroundColor: "#fff6d6",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1d18a",
  },
  sheetCloseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3a2f00",
  },
});

export default TopupHistory;
