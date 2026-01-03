import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { listTrxDetail } from "../../../services/listTrxDetail";
import { fetchPotMember } from "../../../services/potMember";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

const PALETTE = {
  pageBg: "#ffffff",
  accentYellow: "#fff247",
  accentPink: "#de0866",
  surface: "#ffffff",
  textPrimary: "#2b2b2b",
  textMuted: "#7a7a7a",
  borderSoft: "rgba(0, 0, 0, 0.06)",
  accentSoft: "rgba(222, 8, 102, 0.08)",
};

export default function ApproveTransaksi() {
  const { id } = useLocalSearchParams();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const { userToken, fetchProfile } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const insets = useSafeAreaInsets();
  
  interface ReceiptItem {
    create_date: ReactNode;
    trx_num: ReactNode;
    kembalian: any;
    bayar: ReactNode;
    master_price: number;
    potongan: ReactNode;
    discount: ReactNode;
    alamat_store: ReactNode;
    user_name: ReactNode;
    slogan: ReactNode;
    group_name: ReactNode;
    id: number;
    name_produk: string;
    qty: number;
    price: number;
  }

  const [receipt, setReceipt] = useState<ReceiptItem[]>([]);
  const receiptShotRef = useRef<ViewShot | null>(null);

  const fetchtrx = async () => {
    const response = await listTrxDetail(Number(id), String(userToken));
    setReceipt(response);
    return response;
  };

  const hasTrxNumber = (data: ReceiptItem[] = receipt) =>
    Boolean((data?.[0] as any)?.trx_num);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const startPolling = async () => {
      try {
        await fetchtrx();
      } catch (error) {
        console.error(error);
      }
      interval = setInterval(async () => {
        try {
          const latest = await fetchtrx();
          if (isTransactionComplete(latest) || hasTrxNumber(latest)) {
            if (interval) clearInterval(interval);
          }
        } catch (error) {
          console.error(error);
        }
      }, 4000);
    };

    if (userToken && id) {
      startPolling();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, userToken]);

  useEffect(() => {
    if (userToken) {
      fetchProfile()
        .then((profile) => {
          setProfile(profile);
        })
        .catch((error) => console.warn(error.message));
    }
  }, [userToken]);

  const totalPrice = receipt.reduce(
    (total, item) => total + item.qty * item.master_price,
    0
  );
  const totaldiscount = receipt.reduce(
    (total, item) =>
      total + (typeof item.discount === "number" ? item.discount : 0),
    0
  );

  const total =
    totalPrice -
    totaldiscount -
    (receipt.length > 0 && typeof receipt[0].potongan === "number"
      ? receipt[0].potongan
      : 0);

  const handleconfirm = async (id: number) => {
    try {
      const result = await fetchPotMember(
        id,
        String(profile?.saving),
        Number(profile.id),
        Number(selectedOption),
        String(userToken)
      );

      if (result?.corp_sp_save_trx_sales_potongan_member === 1) {
        setModalMessage(
          "Transaksi berhasil!,Saving akan Terpotong setelah selesai transaksi"
        );
        setModalVisible(true);
      } else {
        setModalMessage("Transaksi gagal!");
        setModalVisible(true);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Terjadi kesalahan saat memproses transaksi.");
    }
  };

  const isTransactionComplete = (data: ReceiptItem[] = receipt) => {
    const trx = data?.[0] as any;
    if (!trx) return false;
    const status =
      trx.status ??
      trx.trx_status ??
      trx.status_trx ??
      trx.status_transaksi ??
      trx.status_trx_member;
    return String(status) === "1" || status === 1 || status === "settlement";
  };

  const shareText = useMemo(() => {
    const trx = receipt[0] as any;
    const items = receipt
      .map(
        (item) =>
          `${item.name_produk} x${item.qty} - Rp ${(item.qty * item.master_price).toLocaleString()}`
      )
      .join("\n");
    return [
      "Nota Belanja",
      trx?.group_name ? `Toko: ${trx.group_name}` : "",
      trx?.trx_num ? `No: ${trx.trx_num}` : "",
      trx?.create_date ? `Tanggal: ${trx.create_date}` : "",
      "",
      items,
      "",
      `Subtotal: Rp ${totalPrice.toLocaleString()}`,
      `Discount: Rp ${totaldiscount.toLocaleString()}`,
      `Potongan: Rp ${receipt[0]?.potongan || 0}`,
      `Total: Rp ${total.toLocaleString()}`,
      `Bayar: Rp ${receipt[0]?.bayar?.toLocaleString() || 0}`,
      `Kembalian: Rp ${receipt[0]?.kembalian?.toLocaleString() || 0}`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [receipt, total, totalPrice, totaldiscount]);

  const handleShare = async () => {
    try {
      if (receiptShotRef.current) {
        const uri = await captureRef(receiptShotRef, {
          format: "png",
          quality: 1,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
          return;
        }
      }
      await Share.share({ message: shareText });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Stack.Screen
            options={{
              headerShown: true,
              title: "Nota Belanja",
              headerStyle: { backgroundColor: PALETTE.accentYellow },
              headerTitleStyle: {
                color: PALETTE.textPrimary,
                fontWeight: "700",
              },
            }}
          />

          {/* Receipt Card */}
          <ViewShot ref={receiptShotRef} style={styles.receiptShot}>
            <View style={styles.receiptCard}>
            <View style={styles.watermarkLayer}>
              {Array.from({ length: 120 }).map((_, idx) => (
                <Text key={idx} style={styles.watermarkText}>
                  LASKAR BUAH
                </Text>
              ))}
            </View>
            {/* Header */}
            <>
              <View style={styles.header}>
                <Text style={styles.storeName}>
                  {receipt.length > 0 ? receipt[0].group_name : "Laskar Buah"}
                </Text>
                <Text>
                  {receipt.length > 0
                    ? receipt[0].slogan
                    : "Toko Buah Paling Murah"}
                </Text>
                <Text>
                  Kasir: {receipt.length > 0 ? receipt[0].user_name : "Users"}
                </Text>
                <Text style={styles.cashierName}>
                  {" "}
                  {receipt.length > 0 ? receipt[0].alamat_store : "Bojonegoro"}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>
                    No: {receipt.length > 0 ? receipt[0].trx_num : "0"}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>
                    Date: {receipt.length > 0 ? receipt[0].create_date : "0"}
                  </Text>
                </View>
              </View>
            </>
            {/* Items */}
            <View style={styles.itemsContainer}>
              {receipt.length > 0 ? (
                receipt.map((item, index) => (
                  <React.Fragment key={`${item.id}-${index}`}>
                    <Text style={styles.itemName}>{item.name_produk}</Text>
                    <View style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        Rp. {item.master_price.toLocaleString()}
                      </Text>
                      <Text style={styles.itemQty}>x{item.qty}</Text>
                      <Text style={styles.itemPrice}>
                        Rp {(item.qty * item.master_price).toLocaleString()}
                      </Text>
                    </View>
                    {typeof item.discount === "number" && item.discount > 0 && (
                      <Text style={styles.itemdiscount}>
                        Rp {item.discount.toLocaleString()}
                      </Text>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Text style={styles.emptyMessage}>
                  Tidak ada data transaksi.
                </Text>
              )}
            </View>

            {/* Total */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Sub Total</Text>
              <Text style={styles.totalPrice}>
                Rp {totalPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Potongan</Text>
              <Text style={styles.totalPrice}>
                Rp {receipt.length > 0 ? receipt[0].potongan : "0"}
              </Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalPrice}>
                Rp {totaldiscount.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.totalContainer, styles.totalHighlight]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>Rp {total.toLocaleString()}</Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Bayar</Text>
              <Text style={styles.totalPrice}>
                Rp{" "}
                {receipt.length > 0 ? receipt[0].bayar?.toLocaleString() : "0"}
              </Text>
            </View>
          </View>
          </ViewShot>
          {!hasTrxNumber() && (
            <View style={styles.receiptCard}>
              <Text style={styles.paymentTitle}>Pilih metode pembayaran</Text>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedOption === "2" && styles.paymentOptionActive,
                ]}
                onPress={() => setSelectedOption("2")}
                activeOpacity={0.85}
              >
                <View style={styles.paymentOptionLeft}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedOption === "2" && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedOption === "2" && (
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    )}
                  </View>
                  <Text style={styles.paymentLabel}>Poin</Text>
                </View>
                <Text style={styles.paymentValue}>{profile?.poin || "0"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedOption === "1" && styles.paymentOptionActive,
                ]}
                onPress={() => setSelectedOption("1")}
                activeOpacity={0.85}
              >
                <View style={styles.paymentOptionLeft}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedOption === "1" && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedOption === "1" && (
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    )}
                  </View>
                  <Text style={styles.paymentLabel}>Savings</Text>
                </View>
                <Text style={styles.paymentValue}>{profile?.saving || "0"}</Text>
              </TouchableOpacity>
            </View>
          )}
          {hasTrxNumber() || isTransactionComplete() ? (
            <View style={styles.shareRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.shareButton, styles.halfButton]}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={20} color="#ffffff" />
                <Text style={[styles.confirmButtonText, styles.shareButtonText]}>
                  Share
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.doneButton, styles.halfButton]}
                onPress={() => router.replace("/")}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                <Text style={[styles.confirmButtonText, styles.shareButtonText]}>
                  Selesai
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                receipt[0]?.potongan !== 0 && styles.disabledButton,
              ]}
              onPress={() => handleconfirm(Number(id))}
              disabled={receipt[0]?.potongan !== 0}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#000000ff"
              />
              <Text style={styles.confirmButtonText}>Konfirmasi</Text>
            </TouchableOpacity>
          )}
          <Modal
            transparent={true}
            visible={modalVisible}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.overlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalMessage}>{modalMessage}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },
  receiptCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "rgba(0,0,0,0.18)",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    borderTopWidth: 3,
    borderTopColor: PALETTE.accentSoft,
  },
  watermarkLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    opacity: 0.1,
    pointerEvents: "none",
    alignContent: "space-between",
    justifyContent: "space-between",
  },
  watermarkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7a5c00",
    letterSpacing: 0.6,
    width: "25%",
    textAlign: "center",
  },
  receiptShot: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderSoft,
    paddingBottom: 12,
    alignItems: "center",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: PALETTE.accentPink,
    marginBottom: 5,
  },
  cashierName: {
    fontSize: 14,
    color: PALETTE.textMuted,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  metaChip: {
    backgroundColor: "#f7f7f7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  metaText: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  itemName: {
    fontSize: 12,
    color: PALETTE.textPrimary,
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
    color: PALETTE.textMuted,
    textAlign: "center",
    width: 40,
  },
  itemPrice: {
    fontSize: 12,
    color: PALETTE.textPrimary,
    textAlign: "right",
    width: 100,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  totalHighlight: {
    backgroundColor: "rgba(255, 242, 71, 0.2)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: PALETTE.textPrimary,
    // textAlign: "left",
  },
  totalLabel2: {
    fontSize: 13,
    fontWeight: "bold",
    color: PALETTE.textPrimary,
    // textAlign: "left",
  },
  totalPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: PALETTE.accentPink,
    textAlign: "right",
  },
  totalPrice2: {
    fontSize: 13,
    fontWeight: "bold",
    color: PALETTE.accentPink,
    textAlign: "right",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.accentYellow,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  confirmButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  shareButton: {
    backgroundColor: PALETTE.accentPink,
  },
  shareButtonText: {
    color: "#ffffff",
  },
  doneButton: {
    backgroundColor: PALETTE.accentPink,
  },
  shareRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfButton: {
    flex: 1,
  },
  emptyMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  itemdiscount: {
    fontSize: 12,
    color: "#333",
    textAlign: "right",
    textDecorationLine: "line-through",
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.textPrimary,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    backgroundColor: PALETTE.surface,
    marginBottom: 10,
  },
  paymentOptionActive: {
    borderColor: PALETTE.accentPink,
    backgroundColor: PALETTE.accentSoft,
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.textPrimary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.accentPink,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: PALETTE.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: PALETTE.accentPink,
    backgroundColor: PALETTE.accentPink,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 300,
    backgroundColor: PALETTE.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: PALETTE.textPrimary,
  },
  closeButton: {
    backgroundColor: PALETTE.accentPink,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  confirmButtons: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  confirmButtonTexts: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "rgba(0,0,0,0.2)", // Warna latar belakang untuk tombol dinonaktifkan
  },
});
