import React, { ReactNode, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { listTrxDetail } from "../../../services/listTrxDetail";
import { fetchProfile } from "../../../services/profileServices";
import { fetchPotMember } from "../../../services/potMember";

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
  const { userToken } = useAuth();
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
  useEffect(() => {
    const fetchtrx = async () => {
      try {
        const response = await listTrxDetail(Number(id), String(userToken));
        setReceipt(response);
      } catch (error) {
        console.error(error);
      }
    };
    fetchtrx();
    // const interval = setInterval(async () => {
    //   fetchtrx();
    // }, 3000);

    // return () => clearInterval(interval);
  }, [id, userToken]);

  useEffect(() => {
    if (userToken) {
      fetchProfile(userToken)
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
      
          // Periksa nilai yang dikembalikan
          if (result?.corp_sp_save_trx_sales_potongan_member === 1) {
            setModalMessage("Transaksi berhasil!,Saving akan Terpotong setelah selesai transaksi");
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

  return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.headerBg, { height: 110 + insets.top }]} />
        <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={PALETTE.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nota Belanja</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          {/* Receipt Card */}
          <View style={styles.receiptCard}>
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
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Kembalian</Text>
              <Text style={styles.totalPrice}>
                Rp{" "}
                {receipt.length > 0
                  ? receipt[0].kembalian?.toLocaleString()
                  : "0"}
              </Text>
            </View>
          </View>
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
          <TouchableOpacity
  style={[
    styles.confirmButton,
    receipt[0]?.potongan !== 0 && styles.disabledButton, // Tambahkan gaya jika tombol dinonaktifkan
  ]}
  onPress={() => handleconfirm(Number(id))}
  disabled={receipt[0]?.potongan !== 0} // Nonaktifkan tombol jika potongan tidak sama dengan 0
>
  <Ionicons name="checkmark-circle-outline" size={20} color="#000000ff" />
  <Text style={styles.confirmButtonText}>Konfirmasi</Text>
</TouchableOpacity>
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
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.accentYellow,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    zIndex: 0,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 1,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PALETTE.textPrimary,
    marginLeft: 12,
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
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    borderTopWidth: 3,
    borderTopColor: PALETTE.accentSoft,
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
