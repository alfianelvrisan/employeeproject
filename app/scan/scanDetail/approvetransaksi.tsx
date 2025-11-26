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
import { useAuth } from "../../../context/AuthContext";
import { AuthProvider } from "../../../context/AuthContext";
import { listTrxDetail } from "../../../services/listTrxDetail";
import { fetchProfile } from "../../../services/profileServices";
import { fetchPotMember } from "../../../services/potMember";

export default function ApproveTransaksi() {
  const { id } = useLocalSearchParams();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const { userToken } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  
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
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTransparent: true,
              headerStyle: {
                backgroundColor: "transparent",
              },
              headerTitle: "Nota Belanja",
              headerTitleAlign: "center",
              headerTintColor: "#000",
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
              <Text style={styles.trxnum}>
                {" "}
                No: {receipt.length > 0 ? receipt[0].trx_num : "0"}
              </Text>
              <Text style={styles.trxnum}>
                {" "}
                Date : {receipt.length > 0 ? receipt[0].create_date : "0"}
              </Text>
            </>
            {/* Items */}
            <View style={styles.itemsContainer}>
              {receipt.length > 0 ? (
                receipt.map((item, index) => (
                  <>
                    <Text style={styles.itemName}>{item.name_produk}</Text>
                    <View key={`${item.id}-${index}`} style={styles.itemRow}>
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
                  </>
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
            <View style={styles.totalContainer}>
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
            {/* Radio Button untuk Poin */}
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  selectedOption === "2" && styles.radioButtonSelected,
                ]}
                onPress={() => setSelectedOption("2")}
              />
              <Text style={styles.totalLabel}>Poin </Text>
              <Text style={styles.totalPrice2}>{profile?.poin || "0"}</Text>
            </View>

            {/* Radio Button untuk Savings */}
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  selectedOption === "1" && styles.radioButtonSelected,
                ]}
                onPress={() => setSelectedOption("1")}
              />
              <Text style={styles.totalLabel}>Savings </Text>
              <Text style={styles.totalPrice2}>{profile?.saving || "0"}</Text>
            </View>
          </View>
          <TouchableOpacity
  style={[
    styles.confirmButton,
    receipt[0]?.potongan !== 0 && styles.disabledButton, // Tambahkan gaya jika tombol dinonaktifkan
  ]}
  onPress={() => handleconfirm(Number(id))}
  disabled={receipt[0]?.potongan !== 0} // Nonaktifkan tombol jika potongan tidak sama dengan 0
>
  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
  <Text style={styles.confirmButtonText}>Konfirmasi</Text>
</TouchableOpacity>
 {receipt[0]?.trx_num !== 0 && (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => {
       router.replace("/");
      }} // Ganti "/" dengan nama halaman awal Anda
    >
      <Ionicons name="arrow-back-circle-outline" size={20} color="#fff" />
      <Text style={styles.backButtonText}>Kembali ke Halaman Awal</Text>
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
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 70,
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  receiptCard: {
    backgroundColor: "#fff",
    borderTopEndRadius: 20,
    borderBottomStartRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
    top: 30,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    alignItems: "center",
  },
  storeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cashierName: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
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
    color: "#333",
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    width: 40,
  },
  itemPrice: {
    fontSize: 12,
    color: "#333",
    textAlign: "right",
    width: 100,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    // textAlign: "left",
  },
  totalLabel2: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    // textAlign: "left",
  },
  totalPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#e60023",
    textAlign: "right",
  },
  totalPrice2: {
    fontSize: 13,
    fontWeight: "bold",
    color: "blue",
    textAlign: "right",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#115f9f",
    paddingVertical: 15,
    borderRadius: 10,
    top: 35,
    marginBottom: 30,
  },
  confirmButtonText: {
    color: "#fff",
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
  trxnum: {
    fontSize: 12,
    color: "#333",
    textAlign: "left",
    marginBottom: 10,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#115f9f",
    backgroundColor: "#115f9f",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#115f9f",
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
    backgroundColor: "#ccc", // Warna latar belakang untuk tombol dinonaktifkan
  },
  backButton: {
    backgroundColor: "#115f9f",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
