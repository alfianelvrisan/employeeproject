import React, { ReactNode, useEffect, useRef, useState } from "react";
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
  Animated,
  TextStyle,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import {
  ListTrxMember,
  deleteTrxMember,
  deleteTrxexp,
} from "../../services/CartServices";
import { fetchProfile } from "../../services/profileServices";
import { IncreDecre } from "../../services/DecreIncre";
import { paymentMidtrans } from "../../services/paymentMidtrans";
import WebView from "react-native-webview";
import { router, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import { cekOrderId } from "../../services/CekOrderId";
import {
  _cekStatusPayment,
  _cekStrukByproduk,
} from "../../services/_cekStatusPayment";
import * as Clipboard from "expo-clipboard";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";
import useScrollHeader from "../../hooks/useScrollHeader";

const Cart = () => {
  const { userToken } = useAuth();
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
  const [selectedTab, setSelectedTab] = useState<string>("List Belanja");
  const [description, setDescription] = useState<string>("");
  const [orderIds, setOrderId] = useState<string>("");
  const [responsePayment, setResponsePayment] = useState<any>(null);
  const [responseByorderId, setResponseByorderId] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(0)).current;
  const { headerStyle, handleScroll } = useScrollHeader();

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    if (!description) {
      setIsFocused(false);
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

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

  const handleRemoveItem = (id: number) => {
    Alert.alert(
      "Hapus Item",
      "Apakah Anda yakin ingin menghapus item ini dari keranjang?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrxMember(id, userToken || "");
              const updatedCartItems = await ListTrxMember(
                Number(idUser),
                userToken || ""
              );
              setCartItems(updatedCartItems || []);
            } catch (error) {
              console.error("Error deleting transaction:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleQuantityChange = (id: number, value: string) => {
    const newQty = parseFloat(value) || 0;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, qty: newQty } : item
      )
    );
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
  const [isModalVisible, setModalVisible] = useState(false);

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
        console.warn("Order ID kosong atau tidak valid.");
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

  const handleDelete = async (trx_num: number) => {
    try {
      await deleteTrxexp(trx_num, userToken || "");
      await fetchAndJoinResponses();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const labelStyle: Animated.WithAnimatedObject<TextStyle> = {
    position: "absolute",
    left: 10,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? "#115f9f" : "#888",
    backgroundColor: "white",
    paddingHorizontal: 5,
  };

  const renderTabContent = () => {
    if (selectedTab === "List Belanja") {
      return (
        <View>
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.cartItem,
                  selectedStore &&
                  selectedStore !== item.name_store &&
                  !selectedItems.includes(item.id)
                    ? styles.disabledCard
                    : null,
                ]}
              >
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleToggleSelection(item.id)}
                  disabled={Boolean(
                    selectedStore &&
                      selectedStore !== item.name_store &&
                      !selectedItems.includes(item.id)
                  )}
                >
                  <Ionicons
                    name={
                      selectedItems.includes(item.id)
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={24}
                    color="#115f9f"
                  />
                </TouchableOpacity>
                <Image source={{ uri: item.foto }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name_produk}</Text>
                  <Text style={styles.itemPrice}>{item.name_store}</Text>
                  <Text style={styles.itemStock}>
                    Stock : {item.qty_stock}
                    <Text style={styles.uom}> /{item.uom}</Text>
                  </Text>
                  <Text
                    style={
                      typeof item.disc_member === "number" &&
                      item.disc_member > 0
                        ? styles.itemPrice2
                        : styles.itemPrice
                    }
                  >
                    Rp {item.price_origin.toLocaleString()}
                    <Text style={styles.uom}>/{item.uom}</Text>
                  </Text>
                  {typeof item.disc_member === "number" &&
                    item.disc_member > 0 && (
                      <Text style={styles.itemPrice}>
                        Rp{" "}
                        {(
                          item.price_origin - item.disc_member
                        ).toLocaleString()}
                      </Text>
                    )}

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      onPress={() => handleDecreaseQuantity(item.id)}
                      disabled={Boolean(
                        selectedStore &&
                          selectedStore !== item.name_store &&
                          !selectedItems.includes(item.id)
                      )}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={24}
                        color="#115f9f"
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.quantityInput}
                      keyboardType="numeric"
                      value={item.qty.toString()}
                      editable={false}
                      onChangeText={(value) =>
                        handleQuantityChange(item.id, value)
                      }
                    />
                    <TouchableOpacity
                      onPress={() =>
                        handleIncreaseQuantity(item.id, Number(item.idh))
                      }
                      disabled={Boolean(
                        selectedStore &&
                          selectedStore !== item.name_store &&
                          !selectedItems.includes(item.id)
                      )}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#115f9f"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.id)}
                  disabled={Boolean(
                    selectedStore &&
                      selectedStore !== item.name_store &&
                      !selectedItems.includes(item.id)
                  )}
                >
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text
              style={{ textAlign: "center", alignItems: "center", top: 100 }}
            >
              No items found in List Belanja.
            </Text>
          )}
        </View>
      );
    } else if (selectedTab === "Belum Bayar") {
      return (
        <View>
          {responsePayment?.length > 0 &&
          responsePayment.some(
            (payment: any) => payment.status !== "settlement"
          ) ? (
            responsePayment
              .filter((payment: any) => payment.status !== "settlement") // Filter untuk mengecualikan status settlement
              .map((payment: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.paymentCard,
                    (payment.status === "expire" || payment.status === null) &&
                      styles.disabledCards,
                  ]}
                >
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
                          payment.status === "pending"
                            ? { color: "orange" }
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
                      <>
                        <View key={idx} style={styles.productItem}>
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
                      </>
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
                        style={[styles.deleteButton, { opacity: 1 }]}
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
              ))
          ) : (
            <Text style={{ textAlign: "center", marginTop: 100 }}>
              Tidak ada pembayaran yang belum selesai.
            </Text>
          )}
        </View>
      );
    } else if (selectedTab === "Selesai") {
      return (
        <View>
          {responsePayment?.length > 0 &&
          responsePayment.some(
            (payment: any) => payment.status === "settlement"
          ) ? (
            responsePayment
              .filter((payment: any) => payment.status === "settlement") // Filter untuk mengecualikan status settlement
              .map((payment: any, index: number) => (
                <View key={index} style={styles.paymentCard}>
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
                      <>
                        <View key={idx} style={styles.productItem}>
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
                      </>
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
              ))
          ) : (
            <Text style={{ textAlign: "center", marginTop: 100 }}>
              Tidak ada pembayaran yang selesai.
            </Text>
          )}
        </View>
      );
    }
  };

  return (
    <AuthProvider>
      <LinearGradient
        colors={["#cde7ff", "#e6f3ff", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
        style={styles.gradientBg}
      >
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View
          style={[
            styles.floatingHeader,
            headerStyle,
          ]}
        >
          <Text style={styles.floatingTitle}>Pesanan</Text>
        </Animated.View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              selectedTab === "List Belanja" && styles.activeButton,
            ]}
            onPress={() => setSelectedTab("List Belanja")}
          >
            <Text
              style={[
                styles.buttonText,
                selectedTab === "List Belanja" && styles.activeButtonText,
              ]}
            >
              List Belanja
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              selectedTab === "Belum Bayar" && styles.activeButton,
            ]}
            onPress={() => setSelectedTab("Belum Bayar")}
          >
            <Text
              style={[
                styles.buttonText,
                selectedTab === "Belum Bayar" && styles.activeButtonText,
              ]}
            >
              Belum Bayar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              selectedTab === "Selesai" && styles.activeButton,
            ]}
            onPress={() => setSelectedTab("Selesai")}
          >
            <Text
              style={[
                styles.buttonText,
                selectedTab === "Selesai" && styles.activeButtonText,
              ]}
            >
              Selesai
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderTabContent()}
          {selectedTab === "List Belanja" && cartItems.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.totalText}>
                Total: Rp{totalPrice.toLocaleString()}
              </Text>
              <Animated.Text style={labelStyle}>
                Tambahkan deskripsi Wajib
              </Animated.Text>
              <TextInput
                style={styles.descriptionInput}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChangeText={(text) => setDescription(text)}
                value={description}
              />
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  selectedItems.length === 0 && styles.disabledButton, // Tambahkan gaya jika tombol dinonaktifkan
                ]}
                onPress={() => handleCheckout()}
                disabled={selectedItems.length === 0} // Nonaktifkan tombol jika tidak ada item yang dipilih
              >
                <Text style={styles.checkoutButtonText}>Bayar sekarang</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.container}>
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
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmCheckout}
                  >
                    <Text style={styles.confirmButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
      </LinearGradient>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingTop: 90,
  },
  gradientBg: {
    flex: 1,
  },
  container: {
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0.1,
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
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  itemPrice: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  itemPrice2: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
    textDecorationLine: "line-through",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  quantityInput: {
    width: 50,
    height: "auto",
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    fontSize: 10,
    marginHorizontal: 5,
    backgroundColor: "#f9f9f9",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 0.1,
    top: 15,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "medium",
    color: "#115f9f",
    marginBottom: 10,
    textAlign: "right",
    fontFamily: "bolder",
  },
  checkoutButton: {
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#115f9f",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  uom: {
    fontSize: 10,
    color: "#666",
    marginLeft: 10,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 0,
  },
  button: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 10,
    marginHorizontal: "0%",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#115f9f",
  },
  button1: {
    flex: 1,
    backgroundColor: "#c3eaff",
    paddingVertical: 10,
    marginHorizontal: "0%",
    // borderRadius: 8,
    borderEndEndRadius: 10,
    borderTopRightRadius: 10,
    alignItems: "center",
  },
  button2: {
    flex: 1,
    backgroundColor: "#c3eaff",
    paddingVertical: 10,
    marginHorizontal: "0%",
    // borderRadius: 8,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#115f9f",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "arial",
  },
  activeButtonText: {
    color: "#fff",
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "rgba(17,95,159,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    elevation: 10,
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    paddingTop: 26,
    paddingHorizontal: 16,
  },
  floatingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  itemStock: {
    fontSize: 12,
    color: "#666",
    marginVertical: 5,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#115f9f",
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: "#333",
    borderRadius: 25,
  },
  belumBayar: {
    top: 100,
    fontSize: 100,
  },
  paymentCard: {
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0.1,
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
    color: "#333",
    textAlign: "center",
  },
  slogan: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  address: {
    marginBottom: 5,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  transactionText: {
    fontSize: 14,
    color: "#333",
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
    color: "#115f9f",
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

  label: {
    width: 120, // atur lebar agar sejajar
    fontWeight: "bold",
  },

  value: {
    flex: 1,
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
  cancelButton: {
    flex: 1,
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#115f9f",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc", // Warna latar belakang untuk tombol dinonaktifkan
  },
});

export default Cart;
function fetchTransactions() {
  throw new Error("Function not implemented.");
}
