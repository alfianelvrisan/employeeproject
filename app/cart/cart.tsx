import React, { ReactNode, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ImageBackground,
  ScrollView,
  RefreshControl,
  Button,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import {
  ListTrxMember,
  deleteTrxMember,
  deleteTrxexp,
} from "../../services/CartServices";
import { fetchProfile } from "../../services/profileServices";
import { IncreDecre } from "../../services/DecreIncre";
import { paymentMidtrans } from "../../services/paymentMidtrans";
import WebView from "react-native-webview";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import { cekOrderId } from "../../services/CekOrderId";
import {
  _cekStatusPayment,
  _cekStrukByproduk,
} from "../../services/_cekStatusPayment";
import * as Clipboard from "expo-clipboard";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useScrollHeader from "../../hooks/useScrollHeader";

const SEARCH_NEON_GRADIENT = [
  "rgba(255, 255, 255, 0.45)",
  "rgba(74,210,255,0.08)",
] as const;
const SEARCH_NEON_MUTED = [
  "rgba(255, 255, 255, 0.15)",
  "rgba(74,210,255,0.02)",
] as const;

const PRIMARY_YELLOW = "#FFF247";
const PRIMARY_YELLOW_DARK = "#BFB010";
const PRIMARY_YELLOW_LIGHT = "#fffacc";
const NEON_GRADIENT = [PRIMARY_YELLOW, "#ffeb3b", "#fbc02d"] as const;
const TAB_DISABLED_GRADIENT = ["#f5f5f5", "#eeeeee"] as const;
const PRIMARY_BUTTON_GRADIENT = [PRIMARY_YELLOW, "#ffeb3b", "#fbc02d"] as const;
const SECONDARY_BUTTON_GRADIENT = ["#ffffff", "#fafafa"] as const;
const WARNING_BUTTON_GRADIENT = ["#ffcdd2", "#ef9a9a", "#e57373"] as const;
const BUTTON_DISABLED_GRADIENT = ["#f0f0f0", "#e0e0e0"] as const;

const Cart = () => {
  const { userToken } = useAuth();
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab: string }>(); // Get tab param
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null); // Track Midtrans Snap URL
  const [cartItems, setCartItems] = useState<
    {
      id_produk?: (id_produk: any) => string;
      idh?: number;
      qty_stock: ReactNode;
      uom?: ReactNode;
      disc_member: ReactNode;
      id: number;
      name_produk: string;
      price_origin: number;
      qty: number;
      foto: string;
      name_store: string;
      status: string;
    }[]
  >([]);
  const [profil, setProfile] = React.useState<{
    nama: string;
    saving: number;
    poin: number;
    ranking: number;
    total: number;
    no_tlp?: string;
  } | null>(null);
  const [idUser, setIdUser] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedId, setSelectedItemss] = useState<number[]>([]);
  const [selectedItemsh, setSelectedItemsh] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>(tab || "List Belanja");
  const [description, setDescription] = useState<string>("");
  const [orderIds, setOrderId] = useState<string>("");
  const [responsePayment, setResponsePayment] = useState<any>(null);
  const [responseByorderId, setResponseByorderId] = useState<any>(null);
  const { headerStyle, handleScroll } = useScrollHeader();

  useEffect(() => {
    if (tab) {
      setSelectedTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetchProfile(userToken || "");
        if (response) {
          setIdUser(response.id);
          setProfile(response);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [userToken]);

  const fetchTrxMember = async () => {
    try {
      if (idUser && userToken) {
        setLoading(true);
        const response = await ListTrxMember(idUser, userToken);
        setCartItems(response || []);
      }
    } catch (error) {
      console.error("Error fetching transaction list:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTrxMember();
    }, [userToken, idUser])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrxMember();
    await fetchAndJoinResponses();
    await _cekOrderid();
    setRefreshing(false);
  };

  const handleAddToCart = (newItem: {
    id_produk: () => string;
    qty_stock: null;
    uom: null;
    disc_member: null;
    id: number;
    name_produk: string;
    price_origin: number;
    qty: number;
    foto: string;
    name_store: string;
  }) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === newItem.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, qty: item.qty + newItem.qty }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            ...newItem,
            id_produk: newItem.id_produk || (() => ""),
            qty_stock: newItem.qty_stock || null,
            uom: newItem.uom || null,
            disc_member: newItem.disc_member || null,
            status: "pending",
          },
        ];
      }
    });
  };

  const [isModalVisible, setModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeletePaymentModalVisible, setDeletePaymentModalVisible] =
    useState(false);
  const [pendingDeleteTrx, setPendingDeleteTrx] = useState<number | null>(null);

  const handleRemoveItem = (id: number) => {
    setPendingDeleteId(id);
    setDeleteModalVisible(true);
  };

  const handleIncreaseQuantity = async (id: number, idh: number) => {
    setSelectedItemsh(idh);
    try {
      await IncreDecre(id, 1, userToken || "");
      const updatedCartItems = await ListTrxMember(
        Number(idUser),
        userToken || ""
      );
      setCartItems(updatedCartItems || []);
    } catch (error) {
      console.error("Error increasing quantity:", error);
    }
  };

  const handleDecreaseQuantity = async (id: number) => {
    try {
      await IncreDecre(id, 2, userToken || "");
      const updatedCartItems = await ListTrxMember(
        Number(idUser),
        userToken || ""
      );
      setCartItems(updatedCartItems || []);
    } catch (error) {
      console.error("Error decreasing quantity:", error);
    }
  };

  const handleToggleSelection = (id: number) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
    setSelectedItemss((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  const selectedStore =
    selectedItems.length > 0
      ? cartItems.find((item) => selectedItems.includes(item.id))?.name_store
      : null;
  const selectedid =
    selectedId.length > 0
      ? cartItems.find((item) => selectedId.includes(item.id))?.idh
      : null;

  const totalPrice = cartItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce(
      (total, item) =>
        total +
        item.qty *
        (item.price_origin -
          (typeof item.disc_member === "number" ? item.disc_member : 0)),
      0
    );

  const totalDiscount = cartItems.reduce(
    (total, item) =>
      total + (typeof item.disc_member === "number" ? item.disc_member : 0),
    0
  );

  // const handleCheckout = async () => {
  //   Alert.alert(
  //     "Konfirmasi Checkout",
  //     "Apakah Anda yakin ingin membuat pesanan?",
  //     [
  //       {
  //         text: "Batal",
  //         style: "cancel",
  //       },
  //       {
  //         text: "OK",
  //         onPress: async () => {
  //           try {
  //             const products = cartItems
  //               .filter((item) => selectedItems.includes(item.id)) // Hanya ambil item yang terselected
  //               .map((item) => ({
  //                 id_produk: String(item.id_produk), // Convert id to string
  //                 nama_produk: item.name_produk,
  //                 harga:
  //                   item.price_origin -
  //                   (typeof item.disc_member === "number"
  //                     ? item.disc_member
  //                     : 0),
  //                 qty: item.qty,
  //               }));

  //             const response = await paymentMidtrans(
  //               Number(selectedid),
  //               String(userToken) || "",
  //               totalPrice,
  //               profil?.nama || "",
  //               profil?.no_tlp || "",
  //               products,
  //               description
  //             );

  //             setRedirectUrl(response.redirect_url);
  //           } catch (error) {
  //             console.error("Error during checkout:", error);
  //             Alert.alert(
  //               "Error",
  //               "Gagal memproses pembayaran. Silakan coba lagi."
  //             );
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };
  const handleCheckout = async () => {
    setModalVisible(true); // Tampilkan modal konfirmasi
  };

  const confirmCheckout = async () => {
    setModalVisible(false); // Tutup modal
    try {
      const products = cartItems
        .filter((item) => selectedItems.includes(item.id)) // Hanya ambil item yang terselected
        .map((item) => ({
          id_produk: String(item.id_produk), // Convert id to string
          nama_produk: item.name_produk,
          harga:
            item.price_origin -
            (typeof item.disc_member === "number" ? item.disc_member : 0),
          qty: item.qty,
        }));

      const response = await paymentMidtrans(
        Number(selectedid),
        String(userToken) || "",
        totalPrice,
        profil?.nama || "",
        profil?.no_tlp || "",
        products,
        description
      );

      setRedirectUrl(response.redirect_url);
    } catch (error) {
      console.error("Error during checkout:", error);
      Alert.alert("Error", "Gagal memproses pembayaran. Silakan coba lagi.");
    }
  };

  const cancelRemoveItem = () => {
    setDeleteModalVisible(false);
    setPendingDeleteId(null);
  };

  const confirmRemoveItem = async () => {
    if (!pendingDeleteId) {
      return;
    }
    setLoading(true);
    try {
      await deleteTrxMember(pendingDeleteId, userToken || "");
      const updatedCartItems = await ListTrxMember(
        Number(idUser),
        userToken || ""
      );
      setCartItems(updatedCartItems || []);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setLoading(false);
      setDeleteModalVisible(false);
      setPendingDeleteId(null);
    }
  };

  if (redirectUrl) {
    router.push({
      pathname: "/cart/checkout/CheckoutDetail",
      params: { redirectUrl },
    });
    setRedirectUrl(null);
    setDescription("");
  }

  const _cekOrderid = async () => {
    const orderId = await cekOrderId(idUser || 0, userToken || "");
    const newOrderIds = orderId.map((item: { reference: any; }) => item.reference);

    if (JSON.stringify(newOrderIds) !== JSON.stringify(orderIds)) {
      setOrderId(newOrderIds);
    }
  };

  useEffect(() => {
    _cekOrderid();
  }, [idUser, userToken]);

  const fetchAndJoinResponses = async () => {
    try {
      const validOrderIds = Array.isArray(orderIds)
        ? orderIds.filter(id => id && id.trim() !== '')
        : [orderIds].filter(id => id && id.trim() !== '');


      if (validOrderIds.length === 0) {
        // console.warn("Order ID kosong atau tidak valid.");
        return;
      }


      const _StatusPay = await _cekStatusPayment(validOrderIds, userToken || "");
      const _cekStruk = await _cekStrukByproduk(Number(idUser), userToken || "");

      const joinedData = _StatusPay.map((statusItem: any) => {
        const matchingStruks = _cekStruk.filter(
          (strukItem: any) => strukItem.reference === statusItem.order_id
        );
        return {
          ...statusItem,
          strukDetailsList: matchingStruks,
        };
      });

      setResponsePayment(joinedData);
    } catch (error) {
      console.error("Error joining responses:", error);
    }
  };


  useEffect(() => {
    fetchAndJoinResponses();
  }, [orderIds, idUser, userToken]);

  const handleDelete = (trx_num: number) => {
    setPendingDeleteTrx(trx_num);
    setDeletePaymentModalVisible(true);
  };

  const cancelDeletePayment = () => {
    setDeletePaymentModalVisible(false);
    setPendingDeleteTrx(null);
  };

  const confirmDeletePayment = async () => {
    if (!pendingDeleteTrx) {
      return;
    }
    try {
      await deleteTrxexp(pendingDeleteTrx, userToken || "");
      await fetchAndJoinResponses();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setDeletePaymentModalVisible(false);
      setPendingDeleteTrx(null);
    }
  };

  type TabButtonProps = {
    label: string;
    isActive: boolean;
    onPress: () => void;
  };

  const TabButton = ({ label, isActive, onPress }: TabButtonProps) => (
    <TouchableOpacity
      style={styles.tabButtonWrapper}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isActive ? ["#fff247", "#fff247"] : TAB_DISABLED_GRADIENT}
        style={[
          styles.tabButtonGradient,
          isActive && styles.tabButtonGradientActive,
        ]}
      >
        <Text
          style={[
            styles.tabButtonText,
            isActive && styles.tabButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (selectedTab === "List Belanja") {
      return (
        <View style={[styles.sectionSpacing, styles.cardList]}>
          {cartItems.length > 0 ? (
            cartItems.map((item) => {
              const isDisabled =
                Boolean(
                  selectedStore &&
                  selectedStore !== item.name_store &&
                  !selectedItems.includes(item.id)
                );
              const hasDiscount =
                typeof item.disc_member === "number" &&
                item.disc_member > 0;
              const finalPrice = hasDiscount
                ? item.price_origin - (item.disc_member as number)
                : item.price_origin;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.cartItem,
                    isDisabled ? styles.disabledCard : null,
                  ]}
                >
                  <View style={styles.cartItemContent}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => handleToggleSelection(item.id)}
                      disabled={isDisabled}
                    >
                      <Ionicons
                        name={
                          selectedItems.includes(item.id)
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={22}
                        color="#6b3a00"
                      />
                    </TouchableOpacity>
                    <Image source={{ uri: item.foto }} style={styles.itemImage} />
                    <View style={styles.itemSummary}>
                      <Text style={styles.itemName}>{item.name_produk}</Text>
                      <View style={styles.storeChip}>
                        <Ionicons name="storefront-outline" size={12} color="#fff" />
                        <Text style={styles.storeText} numberOfLines={1}>
                          {item.name_store}
                        </Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text style={styles.currentPrice}>
                          Rp {finalPrice.toLocaleString()}
                        </Text>
                        {hasDiscount && (
                          <Text style={styles.originalPrice}>
                            Rp {item.price_origin.toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.actionsColumn}>
                      <TouchableOpacity
                        style={styles.deleteIconContainer}
                        onPress={() => handleRemoveItem(item.id)}
                        disabled={isDisabled}
                      >
                        <Ionicons name="trash-outline" size={20} color="#d7263d" />
                      </TouchableOpacity>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => handleDecreaseQuantity(item.id)}
                          disabled={isDisabled}
                        >
                          <Ionicons name="remove" size={20} color="#6b3a00" />
                        </TouchableOpacity>
                        <View style={styles.qtyValue}>
                          <Text style={styles.qtyValueText}>{item.qty}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() =>
                            handleIncreaseQuantity(item.id, Number(item.idh))
                          }
                          disabled={isDisabled}
                        >
                          <Ionicons name="add" size={20} color="#6b3a00" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyStateText}>
              No items found in List Belanja.
            </Text>
          )}
        </View>
      );
    } else if (selectedTab === "Belum Bayar") {
      return (
        <View style={[styles.sectionSpacing, styles.paymentListWrapper]}>
          {responsePayment?.length > 0 &&
            responsePayment.some(
              (payment: any) => payment.status !== "settlement"
            ) ? (
            responsePayment
              .filter((payment: any) => payment.status !== "settlement")
              .map((payment: any, index: number) => (
                <View key={index} style={styles.paymentCardShell}>
                  <View
                    style={[
                      styles.paymentCard,
                      (payment.status === "expire" || payment.status === null) &&
                      styles.disabledCards,
                    ]}
                  >
                    <Text style={styles.groupName}>
                      {payment.strukDetailsList?.[0]?.group_name || "Nama Toko"}
                    </Text>
                    <Text style={styles.slogan}>
                      {payment.strukDetailsList?.[0]?.slogan || "Slogan Toko"}
                    </Text>
                    <Text style={styles.address}>
                      {payment.strukDetailsList?.[0]?.alamat_store ||
                        "Alamat Toko"}
                    </Text>

                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        No Transaksi:{" "}
                        {payment.strukDetailsList?.[0]?.trx_num || "N/A"}
                      </Text>
                      <View style={styles.statusPill}>
                        <Text
                          style={[
                            styles.statusPillText,
                            payment.status === "pending" && styles.statusPending,
                            payment.status === "expire" && styles.statusExpire,
                            payment.status === "settlement" &&
                            styles.statusSettlement,
                          ]}
                        >
                          {payment.status || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        Store:{" "}
                        {payment.strukDetailsList?.[0]?.name_store || "N/A"}
                      </Text>
                      <Text style={styles.transactionText}>
                        Member:{" "}
                        {payment.strukDetailsList?.[0]?.user_name || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.productList}>
                      {payment.strukDetailsList?.map((item: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <View style={styles.productItem}>
                            <Text style={styles.productName}>
                              {idx + 1}. {item.name_produk}
                            </Text>
                          </View>
                          <View style={styles.productDetails}>
                            <Text style={styles.productQty}>Qty: {item.qty}</Text>
                            <Text style={styles.productPrice}>
                              Harga: Rp {item.price.toLocaleString("id-ID")}
                            </Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>

                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        Subtotal: Rp{" "}
                        {payment?.strukDetailsList?.[0]?.total_price?.toLocaleString(
                          "id-ID"
                        ) || "N/A"}
                      </Text>
                      <Text style={styles.transactionText}>
                        PPN: Rp{" "}
                        {payment?.strukDetailsList?.[0]?.ppn?.toLocaleString(
                          "id-ID"
                        ) || 0}
                      </Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        Grand Total: Rp{" "}
                        {payment?.strukDetailsList?.[0]?.total?.toLocaleString(
                          "id-ID"
                        ) || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        Bank: {payment.va_numbers?.[0]?.bank || "N/A"}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyRow}
                        onPress={() =>
                          typeof payment.va_numbers?.[0]?.va_number === "string" &&
                          handleCopy(payment.va_numbers[0].va_number)
                        }
                      >
                        <Text style={styles.transactionText}>
                          VA:{" "}
                          {payment.va_numbers?.[0]?.va_number ||
                            payment.permata_va_number ||
                            "-"}
                        </Text>
                        <Icon name="content-copy" size={18} color="#6b3a00" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.vaHint}>
                      Note: Lakukan pembayaran melalui VA di atas.
                    </Text>

                    {(payment.status === null || payment.status === "expire") && (
                      <TouchableOpacity>
                        <Text
                          style={[styles.deleteButton, { opacity: 1 }]}
                          onPress={() => handleDelete(payment.strukDetailsList[0].id)}
                        >
                          <Ionicons name="trash" size={15} />
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
          ) : (
            <Text style={styles.emptyStateText}>
              Tidak ada pembayaran yang belum selesai.
            </Text>
          )}
        </View>
      );
    } else if (selectedTab === "Selesai") {
      return (
        <View style={[styles.sectionSpacing, styles.historyListWrapper]}>
          {responsePayment?.length > 0 &&
            responsePayment.some(
              (payment: any) => payment.status === "settlement"
            ) ? (
            responsePayment
              .filter((payment: any) => payment.status === "settlement") // Filter untuk mengecualikan status settlement
              .map((payment: any, index: number) => (
                <View key={index} style={styles.paymentCardShell}>
                  <View style={styles.paymentCard}>
                    {/* Header */}
                    <Text style={styles.groupName}>
                      {payment.strukDetailsList?.[0]?.group_name || "Nama Toko"}
                    </Text>
                    <Text style={styles.slogan}>
                      {payment.strukDetailsList?.[0]?.slogan || "Slogan Toko"}
                    </Text>
                    <Text style={styles.address}>
                      {payment.strukDetailsList?.[0]?.alamat_store ||
                        "Alamat Toko"}
                    </Text>

                    {/* Informasi Transaksi */}
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        No Transaksi:{" "}
                        {payment.strukDetailsList?.[0]?.trx_num || "N/A"}
                      </Text>
                      <Text style={styles.transactionText}>
                        Status:{" "}
                        <Text
                          style={[
                            payment.status === "settlement"
                              ? styles.settlement
                              : payment.status === "expire"
                                ? { color: "red" }
                                : { color: "black" },
                          ]}
                        >
                          {payment.status || "N/A"}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        Store:{" "}
                        {payment.strukDetailsList?.[0]?.name_store || "N/A"}
                      </Text>
                      <Text style={styles.transactionText}>
                        Member:{" "}
                        {payment.strukDetailsList?.[0]?.user_name || "N/A"}
                      </Text>
                    </View>

                    {/* Produk */}
                    <View style={styles.productList}>
                      {payment.strukDetailsList?.map((item: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <View style={styles.productItem}>
                            <Text style={styles.productName}>
                              {idx + 1}. {item.name_produk}
                            </Text>
                          </View>
                          <View style={styles.productDetails}>
                            <Text style={styles.productQty}>Qty: {item.qty}</Text>
                            <Text style={styles.productPrice}>
                              Harga: Rp {item.price.toLocaleString("id-ID")}
                            </Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>

                    {/* Footer */}
                    <Text style={styles.detailRow}>
                      Expired At: {payment.expired_at || "N/A"}
                    </Text>
                    <Text style={styles.detailRow}>
                      Payment Type: {payment.payment_type || "N/A"}
                    </Text>
                    <Text style={styles.detailRow}>
                      Tanggal:{" "}
                      {payment.strukDetailsList?.[0]?.create_date
                        ? new Date(
                          payment.strukDetailsList[0].create_date
                        ).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "Tanggal tidak tersedia"}
                    </Text>
                    {payment.va && payment.va.length > 0 && (
                      <View>
                        {payment.va.map(
                          (
                            vaItem: {
                              bank: string;
                              va_number: string;
                            },
                            index: React.Key | null | undefined
                          ) => (
                            <View key={index}>
                              <Text>Bank: {vaItem.bank}</Text>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailRow}>
                                  VA Number: {vaItem.va_number}
                                </Text>
                                <TouchableOpacity
                                  onPress={() =>
                                    typeof vaItem.va_number === "string" &&
                                    handleCopy(vaItem.va_number)
                                  }
                                >
                                  <Icon
                                    name="content-copy"
                                    size={20}
                                    color="#007AFF"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )
                        )}
                      </View>
                    )}
                    {(payment.status === null || payment.status === "expire") && (
                      <TouchableOpacity>
                        <Text
                          style={styles.deleteButton}
                          onPress={() =>
                            handleDelete(payment.strukDetailsList[0].id)
                          }
                        >
                          <Ionicons name="trash" size={15} />
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
          ) : (
            <Text style={styles.emptyStateText}>
              Tidak ada pembayaran yang selesai.
            </Text>
          )}
        </View>
      );
    }
  };

  return (
    <LinearGradient
      colors={[PRIMARY_YELLOW_LIGHT, "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.3 }}
      style={styles.gradientBg}
    >
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitleAlign: "left",
            headerTitle: () => (
              <View style={styles.headerTitleWrapper}>
                <Text style={styles.headerTitleText}>Pesanan</Text>
                <Text style={styles.headerSubtitleText}>
                  Kelola keranjang dan pembayaran
                </Text>
              </View>
            ),
            headerBackground: () => (
              <View style={{ flex: 1, backgroundColor: PRIMARY_YELLOW }} />
            ),
            headerStyle: {
              backgroundColor: PRIMARY_YELLOW,
            },
            headerShadowVisible: false,
            headerTintColor: "#000",
          }}
        />
        <View style={styles.tabRow}>
          <TabButton
            label="List Belanja"
            isActive={selectedTab === "List Belanja"}
            onPress={() => setSelectedTab("List Belanja")}
          />
          <TabButton
            label="Belum Bayar"
            isActive={selectedTab === "Belum Bayar"}
            onPress={() => setSelectedTab("Belum Bayar")}
          />
          <TabButton
            label="Selesai"
            isActive={selectedTab === "Selesai"}
            onPress={() => setSelectedTab("Selesai")}
          />
        </View>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                (selectedTab === "List Belanja" ? 140 : 100) + insets.bottom,
            },
          ]}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderTabContent()}
          {selectedTab === "List Belanja" && cartItems.length > 0 ? (
            <View style={[styles.sectionSpacing, styles.checkoutWrapper]}>
              <LinearGradient
                colors={NEON_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkoutCardGradient}
              >
                <View style={styles.checkoutCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalText}>
                      Rp{totalPrice.toLocaleString()}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.descriptionInput}
                    onChangeText={(text) => setDescription(text)}
                    value={description}
                    placeholder="Tambahkan deskripsi pesanan (opsional)"
                    placeholderTextColor="#000000ff"
                  />
                  <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={selectedItems.length === 0}
                    activeOpacity={0.8}
                    style={styles.checkoutButtonWrapper}
                  >
                    <LinearGradient
                      colors={
                        selectedItems.length === 0
                          ? BUTTON_DISABLED_GRADIENT
                          : PRIMARY_BUTTON_GRADIENT
                      }
                      style={[
                        styles.checkoutButtonGradient,
                        selectedItems.length === 0 &&
                        styles.checkoutButtonGradientDisabled,
                      ]}
                    >
                      <View style={styles.buyNowContent}>
                        <Text
                          style={[
                            styles.checkoutButtonText,
                            selectedItems.length === 0 &&
                            styles.checkoutButtonTextDisabled,
                          ]}
                        >
                          Bayar sekarang
                        </Text>
                        <Ionicons
                          name="cart-outline"
                          size={22}
                          color={
                            selectedItems.length === 0 ? "#000000ff" : "#4b2d00"
                          }
                          style={styles.checkoutIcon}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.bottomFill} pointerEvents="none" />
        <Modal
          transparent={true}
          visible={isModalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Konfirmasi Checkout</Text>
              <Text style={styles.modalMessage}>
                Apakah Anda yakin ingin membuat pesanan?
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.8}
                  style={styles.modalButtonWrapper}
                >
                  <LinearGradient
                    colors={SECONDARY_BUTTON_GRADIENT}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Batal</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmCheckout}
                  activeOpacity={0.8}
                  style={styles.modalButtonWrapper}
                >
                  <LinearGradient
                    colors={PRIMARY_BUTTON_GRADIENT}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                      OK
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          transparent={true}
          visible={isDeletePaymentModalVisible}
          animationType="fade"
          onRequestClose={cancelDeletePayment}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Hapus Transaksi</Text>
              <Text style={styles.modalMessage}>
                Apakah Anda yakin ingin menghapus transaksi ini?
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={cancelDeletePayment}
                  activeOpacity={0.8}
                  style={styles.modalButtonWrapper}
                >
                  <LinearGradient
                    colors={SECONDARY_BUTTON_GRADIENT}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Batal</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDeletePayment}
                  activeOpacity={0.8}
                  style={styles.modalButtonWrapper}
                >
                  <LinearGradient
                    colors={PRIMARY_BUTTON_GRADIENT}
                    style={styles.modalButtonGradient}
                  >
                    <Text
                      style={[styles.modalButtonText, styles.modalButtonTextPrimary]}
                    >
                      Hapus
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          transparent={true}
          visible={isDeleteModalVisible}
          animationType="fade"
          onRequestClose={cancelRemoveItem}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Hapus Item</Text>
              <Text style={styles.modalMessage}>
                Apakah Anda yakin ingin menghapus item ini dari keranjang?
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={cancelRemoveItem}
                  activeOpacity={0.8}
                  style={styles.modalButtonWrapper}
                >
                  <LinearGradient
                    colors={SECONDARY_BUTTON_GRADIENT}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Batal</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmRemoveItem}
                  activeOpacity={0.8}
                  style={styles.modalButtonWrapper}
                >
                  <LinearGradient
                    colors={PRIMARY_BUTTON_GRADIENT}
                    style={styles.modalButtonGradient}
                  >
                    <Text
                      style={[styles.modalButtonText, styles.modalButtonTextPrimary]}
                    >
                      Hapus
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  sectionSpacing: {
    width: "100%",
    marginBottom: 24,
  },
  cardList: {
    width: "100%",
    alignItems: "stretch",
    paddingTop: 4,
    paddingBottom: 12,
  },
  gradientBg: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  crossContainer: {
    flex: 1,
    // marginTop: 20,
    paddingHorizontal: 10,
  },
  listContainer: {
    paddingBottom: 80,
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0.1,
  },
  skeletonImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    marginRight: 10,
  },
  skeletonDetails: {
    flex: 1,
  },
  skeletonText: {
    height: 15,
    backgroundColor: "#e0e0e0",
    marginBottom: 10,
    borderRadius: 5,
  },
  skeletonTextSmall: {
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    width: "50%",
  },
  cartItem: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0,
    width: "100%",
  },
  cartItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  disabledCard: {
    backgroundColor: "#f0f0f0",
    opacity: 0.5,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000ff",
    marginBottom: 8,
  },
  itemSummary: {
    flex: 1,
  },
  storeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#de0866",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  storeText: {
    fontSize: 11,
    color: "#ffffff",
    marginLeft: 6,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b3a00",
  },
  originalPrice: {
    fontSize: 12,
    color: "#c19c65",
    textDecorationLine: "line-through",
  },
  stockText: {
    fontSize: 12,
    color: "#8d6a00",
  },
  deleteIconContainer: {
    padding: 6,
    backgroundColor: "transparent",
    borderRadius: 8,
    marginBottom: 4,
  },
  checkoutWrapper: {
    width: "100%",
    paddingBottom: 12,
    paddingTop: 8,
    marginTop: 12,
  },
  checkoutCardGradient: {
    borderRadius: 24,
    padding: 2,
    shadowColor: PRIMARY_YELLOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  checkoutCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: "#000000ff",
    fontWeight: "600",
  },
  totalGlass: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: "#fff9e6",
    borderWidth: 1,
    borderColor: "rgba(255,199,0,0.35)",
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000ff",
    textAlign: "right",
    fontFamily: "bolder",
    marginRight: 8,
  },
  checkoutButtonWrapper: {
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 10,
    width: "100%",
  },
  checkoutButtonGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 0,
    elevation: 10,
  },
  checkoutButtonGradientDisabled: {
    opacity: 0.9,
  },
  checkoutButtonText: {
    color: "#4b2d00",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkoutButtonTextDisabled: {
    color: "#000000ff",
  },
  buyNowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutIcon: {
    marginLeft: 6,
  },
  checkoutButtonFull: {
    width: "100%",
  },
  bottomFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    backgroundColor: "#ffffffff",
  },
  uom: {
    fontSize: 10,
    color: "#666",
    marginLeft: 10,
    fontWeight: "bold",
  },
  actionsColumn: {
    marginLeft: "auto",
    alignItems: "flex-end", // Align children (delete & qty) to the right
    justifyContent: "center",
    paddingVertical: 0,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12, // More spacing from delete icon
    backgroundColor: "#fff247", // Light background for the whole control
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#fff247",
  },
  qtyButton: {
    width: 28, // Smaller button
    height: 28, // Smaller button
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  qtyValue: {
    minWidth: 30, // Compact width
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  qtyValueText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b3a00",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 6,
    backgroundColor: "transparent",
  },
  tabButtonWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  tabButtonGradient: {
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    elevation: 2,
    marginTop: 0,
  },
  tabButtonGradientActive: {
    borderColor: "rgba(255,193,7,0.5)",
    shadowColor: "rgba(255, 174, 0, 0.65)",
    shadowOpacity: 0.65,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  tabButtonText: {
    color: "#7b5a00",
    fontSize: 15,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: "#3e2900",
  },
  itemStock: {
    fontSize: 12,
    color: "#666",
    marginVertical: 5,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.5)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    fontSize: 14,
    color: "#1a1a1a",
    borderRadius: 22,
    backgroundColor: "#fff9e7",
  },
  belumBayar: {
    top: 100,
    fontSize: 100,
  },
  paymentListWrapper: {
    width: "100%",
    alignItems: "stretch",
    paddingTop: 6,
    paddingBottom: 30,
  },
  paymentCardShell: {
    width: "100%",
    borderRadius: 20,
    padding: 2,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  historyListWrapper: {
    width: "100%",
    alignItems: "stretch",
    paddingTop: 6,
    paddingBottom: 30,
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  paymentOrderId: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  paymentStatus: {
    fontSize: 14,
    color: "#666",
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 60,
    color: "#8a8a8a",
  },
  receiptCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  receiptHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b2d00",
    textAlign: "center",
  },
  slogan: {
    fontSize: 14,
    color: "#7a5c00",
    textAlign: "center",
  },
  address: {
    marginBottom: 5,
    fontSize: 12,
    color: "#a07c18",
    textAlign: "center",
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  transactionText: {
    fontSize: 14,
    color: "#000000ff",
    marginBottom: 5,
  },
  productList: {
    borderTopWidth: 2,
    borderTopColor: "#ddd",
    paddingTop: 20,
    marginBottom: 10,
    paddingBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
    borderStyle: "dashed",
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  productQty: {
    fontSize: 14,
    color: "#555",
  },
  productPrice: {
    fontSize: 14,
    color: "#6b3a00",
    fontWeight: "bold",
  },
  noProducts: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
  receiptFooter: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  statusPill: {
    backgroundColor: "rgba(255,195,0,0.12)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#a87000",
    textTransform: "capitalize",
  },
  statusPending: {
    color: "#f5a524",
  },
  statusExpire: {
    color: "#d7263d",
  },
  statusSettlement: {
    color: "#1c8d3a",
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vaHint: {
    fontSize: 12,
    color: "#6a7a96",
    marginTop: 6,
  },
  headerTitleWrapper: {
    alignItems: "flex-start",
    marginTop: -4,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  headerSubtitleText: {
    fontSize: 12,
    color: "#000",
  },
  headerBackgroundGradient: {
    flex: 1,
  },

  label: {
    width: 120, // atur lebar agar sejajar
    fontWeight: "bold",
  },

  value: {
    flex: 1,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalButtonWrapper: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  modalButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4b2d00",
  },
  modalButtonTextPrimary: {
    color: "#3a2500",
  },
  deleteButton: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  settlement: {
    color: "white",
    backgroundColor: "green",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 10,
  },
  disabledCards: {
    opacity: 0.8, // Membuat kartu terlihat transparan
    backgroundColor: "#f5f5f5", // Warna latar belakang untuk kartu yang dinonaktifkan
  },
  inputContainer: {
    position: "relative",
    marginVertical: 20,
  },
  // descriptionInput: {
  //   height: 40,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#888",
  //   fontSize: 16,
  //   paddingHorizontal: 10,
  // },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  // buttonContainer: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   width: "100%",
  // },
});

export default Cart;
function fetchTransactions() {
  throw new Error("Function not implemented.");
}
