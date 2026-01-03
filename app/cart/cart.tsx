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
  Modal,
  Share,
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
import { IncreDecre } from "../../services/DecreIncre";
import { paymentMidtrans } from "../../services/paymentMidtrans";
import { createQris, getQrisStatusByOrderId } from "../../services/qris";
import { getPendingQris } from "../../services/pendingQris";
import { _cekStrukByproduk } from "../../services/_cekStatusPayment";
import WebView from "react-native-webview";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import ViewShot, { captureRef } from "react-native-view-shot";
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
const PENDING_QRIS_EXPIRES_MINUTES = 15;

const Cart = () => {
  const { userToken, fetchProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab: string }>(); // Get tab param
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null); // legacy midtrans
  const [qrisData, setQrisData] = useState<{
    order_id: string;
    qris_url: string;
    status: string;
    expires_at: string;
    sales_id: number;
  } | null>(null);
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
  const responsePayment: any[] = [];
  const [pendingQris, setPendingQris] = useState<any[]>([]);
  const [completedTrx, setCompletedTrx] = useState<any[]>([]);
  const [completedPage, setCompletedPage] = useState(1);
  const pendingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pendingNow, setPendingNow] = useState<number>(Date.now());
  const qrisShotRefs = useRef<Record<string, ViewShot | null>>({});
  const completedShotRefs = useRef<Record<string, ViewShot | null>>({});
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
        const response = await fetchProfile();
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
      fetchPendingQris();
    }, [userToken, idUser])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrxMember();
    await fetchPendingQris();
    await fetchCompletedTrx();
    setRefreshing(false);
  };

  const normalizeStatus = (value: unknown) => {
    if (value === null || value === undefined) return undefined;
    return String(value).toLowerCase();
  };

  const normalizeDateString = (value?: string) => {
    if (!value) return null;
    const trimmed = value.trim();
    const match = trimmed.match(
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?$/
    );
    if (!match) return trimmed;
    const fraction = match[2]
      ? match[2].slice(0, 4).padEnd(4, "0").slice(0, 4)
      : "";
    if (!fraction) return match[1];
    return `${match[1]}${fraction.slice(0, 4)}`;
  };

  const formatDateTime = (value?: string) => {
    const normalized = normalizeDateString(value);
    if (!normalized) return "-";
    const parsed = Date.parse(normalized);
    if (Number.isNaN(parsed)) return "-";
    return new Date(parsed).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseDateMs = (value?: string) => {
    const normalized = normalizeDateString(value);
    if (!normalized) return null;
    const parsed = Date.parse(normalized);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  };

  const isTerminalStatus = (status?: string, paidProcessed?: boolean) => {
    if (paidProcessed) return true;
    const normalized = normalizeStatus(status);
    return normalized === "expire" || normalized === "expired" ||
      normalized === "settlement" || normalized === "success" ||
      normalized === "paid" || normalized === "capture";
  };

  const fetchPendingQris = async () => {
    if (!userToken) {
      setPendingQris([]);
      return true;
    }
    if (!idUser) {
      setPendingQris([]);
      return true;
    }
    try {
      const result = await getPendingQris(Number(idUser), userToken);
      const list = Array.isArray(result) ? result : [];
      const enriched = await Promise.all(
        list.map(async (item: any) => {
          if (!item?.reference) {
            return { ...item, status: "pending" };
          }
          try {
            const statusRes = await getQrisStatusByOrderId(
              item.reference,
              userToken
            );
            const status = normalizeStatus(
              statusRes?.status || statusRes?.midtrans_status
            );
            const expiresAt = statusRes?.expires_at || item.expires_at;
            return {
              ...item,
              status: status || "pending",
              expires_at: expiresAt,
              paid_processed: statusRes?.paid_processed === true,
            };
          } catch (error) {
            console.error("Error fetching QRIS status:", error);
            return { ...item, status: "pending" };
          }
        })
      );
      setPendingQris(enriched);
      return (
        enriched.length === 0 ||
        enriched.every((item) =>
          isTerminalStatus(item.status, item.paid_processed)
        )
      );
    } catch (error) {
      console.error("Error fetching pending QRIS:", error);
      setPendingQris([]);
      return true;
    }
  };

  const fetchCompletedTrx = async () => {
    if (!userToken || !idUser) {
      setCompletedTrx([]);
      return;
    }
    try {
      const result = await _cekStrukByproduk(Number(idUser), userToken);
      const list = Array.isArray(result) ? result : [];
      const pendingRefs = Array.from(
        new Set(
          list
            .filter(
              (item: any) =>
                String(item?.qris_status || "").toUpperCase() === "PENDING" &&
                typeof item?.reference === "string"
            )
            .map((item: any) => item.reference)
        )
      );
      const statusUpdates = await Promise.all(
        pendingRefs.map(async (reference) => {
          try {
            const res = await getQrisStatusByOrderId(reference, userToken);
            const status = normalizeStatus(
              res?.status || res?.midtrans_status
            );
            return { reference, status };
          } catch (error) {
            console.error("Error fetching QRIS status:", error);
            return { reference, status: null };
          }
        })
      );
      const statusMap = new Map(
        statusUpdates
          .filter((item) => item.status)
          .map((item) => [item.reference, String(item.status).toUpperCase()])
      );
      const updated = list.map((item: any) => {
        const updatedStatus = statusMap.get(item.reference);
        if (!updatedStatus) return item;
        return { ...item, qris_status: updatedStatus };
      });
      setCompletedTrx(updated);
    } catch (error) {
      console.error("Error fetching completed transactions:", error);
      setCompletedTrx([]);
    }
  };

  useEffect(() => {
    fetchPendingQris();
  }, [userToken, idUser]);

  useEffect(() => {
    if (selectedTab !== "Belum Bayar") {
      if (pendingPollRef.current) {
        clearInterval(pendingPollRef.current);
        pendingPollRef.current = null;
      }
      return;
    }
    let isMounted = true;
    const startPolling = async () => {
      const done = await fetchPendingQris();
      if (!isMounted || done) return;
      if (pendingPollRef.current) {
        clearInterval(pendingPollRef.current);
      }
      pendingPollRef.current = setInterval(async () => {
        const stop = await fetchPendingQris();
        if (stop && pendingPollRef.current) {
          clearInterval(pendingPollRef.current);
          pendingPollRef.current = null;
        }
      }, 60000);
    };
    startPolling();
    return () => {
      isMounted = false;
      if (pendingPollRef.current) {
        clearInterval(pendingPollRef.current);
        pendingPollRef.current = null;
      }
    };
  }, [selectedTab, userToken, idUser]);

  useEffect(() => {
    if (selectedTab !== "Belum Bayar") return;
    const interval = setInterval(() => {
      setPendingNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === "Belum Bayar") {
      fetchPendingQris();
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === "Selesai") {
      fetchCompletedTrx();
      setCompletedPage(1);
    }
  }, [selectedTab]);

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
  const [isPaymentMethodModalVisible, setPaymentMethodModalVisible] =
    useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("QRIS");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeletePaymentModalVisible, setDeletePaymentModalVisible] =
    useState(false);
  const [pendingDeleteTrx, setPendingDeleteTrx] = useState<number | null>(null);
  const paymentMethods = [
    "QRIS",
    "Gopay",
    "Shopeepay",
    "BRIVA",
    "LinkAja",
    "OVO",
    "Saving",
  ];

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

  const handleShareQris = async (qrisKey: string, reference?: string) => {
    const shotRef = qrisShotRefs.current[qrisKey];
    if (!shotRef) return;
    try {
      const uri = await captureRef(shotRef, { format: "png", quality: 1 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
        return;
      }
      await Share.share({
        message: `QRIS ${reference || ""}`.trim(),
      });
    } catch (error) {
      console.error("Error sharing QRIS:", error);
    }
  };

  const handleShareReceipt = async (receiptKey: string) => {
    const shotRef = completedShotRefs.current[receiptKey];
    if (!shotRef) return;
    try {
      const uri = await captureRef(shotRef, { format: "png", quality: 1 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
        return;
      }
      await Share.share({ message: "Struk pembayaran" });
    } catch (error) {
      console.error("Error sharing receipt:", error);
    }
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
  const handlingFee = Math.round(totalPrice * 0.007);
  const grandTotal = totalPrice + handlingFee;

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
      const selectedCartItems = cartItems.filter((item) =>
        selectedItems.includes(item.id)
      );
      if (selectedCartItems.length === 0) {
        Alert.alert("Error", "Pilih minimal 1 item untuk dibayar.");
        return;
      }

      const uniqueIdh = Array.from(
        new Set(
          selectedCartItems
            .map((item) => item.idh)
            .filter((idh) => typeof idh === "number")
        )
      );
      if (uniqueIdh.length !== 1) {
        Alert.alert(
          "Error",
          "Pilih item dari satu transaksi/toko saja untuk dibayar."
        );
        return;
      }

      const selectedTrxId = uniqueIdh[0];
      if (!selectedTrxId) {
        Alert.alert("Error", "Transaksi tidak valid. Coba pilih ulang item.");
        return;
      }

      const products = selectedCartItems.map((item) => ({
        id_produk: String(item.id_produk), // Convert id to string
        nama_produk: item.name_produk,
        harga:
          item.price_origin -
          (typeof item.disc_member === "number" ? item.disc_member : 0),
        qty: item.qty,
      }));

      const derivedAmount = products.reduce(
        (sum, item) => sum + item.harga * item.qty,
        0
      );
      if (derivedAmount <= 0) {
        Alert.alert("Error", "Total transaksi tidak valid.");
        return;
      }

      if (!profil?.no_tlp || !profil?.nama) {
        Alert.alert(
          "Error",
          "Data profil belum lengkap. Mohon lengkapi nama dan nomor telepon."
        );
        return;
      }

      const productIds = selectedCartItems.map((item) =>
        Number(item.id_produk || item.id)
      );
      const qrisResponse = await createQris(
        Number(selectedTrxId),
        grandTotal,
        productIds,
        description,
        15,
        String(userToken) || ""
      );
      setQrisData({
        order_id: qrisResponse.order_id,
        qris_url: qrisResponse.qris_url,
        status: qrisResponse.status,
        expires_at: qrisResponse.expires_at,
        sales_id: Number(selectedTrxId),
      });
    } catch (error) {
      console.error("Error during checkout:", error);
      let message = "Gagal memproses pembayaran. Silakan coba lagi.";
      if (error instanceof Error && error.message) {
        try {
          const parsed = JSON.parse(error.message);
          message = parsed?.message || message;
        } catch {
          message = error.message;
        }
      }
      Alert.alert("Error", message);
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

  useEffect(() => {
    if (redirectUrl) {
      router.push({
        pathname: "/cart/checkout/CheckoutDetail",
        params: { redirectUrl },
      });
      setRedirectUrl(null);
      setDescription("");
    }
  }, [redirectUrl]);

  useEffect(() => {
    if (!qrisData) return;
    router.push({
      pathname: "/cart/checkout/CheckoutDetail",
      params: {
        qrisUrl: qrisData.qris_url,
        orderId: qrisData.order_id,
        status: qrisData.status,
        expiresAt: qrisData.expires_at,
        salesId: String(qrisData.sales_id),
      },
    });
    setQrisData(null);
    setDescription("");
  }, [qrisData]);

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
          {pendingQris.length > 0 ? (
            pendingQris.map((item: any, index: number) => {
              const qrisKey = String(item.reference || item.id || index);
              return (
                <View key={index} style={styles.paymentCardShell}>
                  <View style={styles.paymentCard}>
                    <Text style={styles.groupName}>Pembayaran QRIS</Text>
                    <Text style={styles.slogan}>Menunggu pembayaran</Text>
                    <Text style={styles.qrisLabelCenter}>QRIS</Text>
                    {item.qris_url && (
                      <View style={styles.qrisCardLite}>
                        <ViewShot
                          ref={(ref) => {
                            qrisShotRefs.current[qrisKey] = ref;
                          }}
                          style={styles.qrisShot}
                        >
                          <Image
                            source={{ uri: item.qris_url }}
                            style={styles.qrisImagePreview}
                          />
                        </ViewShot>
                        <Text
                          style={[
                            styles.qrisStatusText,
                            (() => {
                              const status = String(item.status || "").toUpperCase();
                              if (status === "EXPIRE" || status === "EXPIRED") {
                                return styles.qrisStatusExpired;
                              }
                              if (status === "PENDING") {
                                return styles.qrisStatusPending;
                              }
                              return styles.qrisStatusSuccess;
                            })(),
                          ]}
                        >
                          Status: {(item.status || "PENDING").toUpperCase()}
                        </Text>
                        <Text style={styles.qrisExpiryText}>
                          Expired:{" "}
                          {formatDateTime(item.expires_at || item.create_date)}
                        </Text>
                        <Text style={styles.qrisTimerText}>
                          Sisa waktu:{" "}
                          {(() => {
                            const baseTime =
                              item.expires_at || item.create_date;
                            if (!baseTime) return "-";
                            const baseMs = parseDateMs(baseTime);
                            if (!baseMs) return "-";
                            const finalExpiresMs = item.expires_at
                              ? baseMs
                              : baseMs +
                                PENDING_QRIS_EXPIRES_MINUTES * 60 * 1000;
                            const diff = Math.max(
                              0,
                              finalExpiresMs - pendingNow
                            );
                            const totalSeconds = Math.floor(diff / 1000);
                            const minutes = Math.floor(totalSeconds / 60);
                            const seconds = totalSeconds % 60;
                            return `${String(minutes).padStart(
                              2,
                              "0"
                            )}:${String(seconds).padStart(2, "0")}`;
                          })()}
                        </Text>
                        <View style={styles.qrisActionRow}>
                          <TouchableOpacity
                            style={styles.qrisPrimaryButton}
                            onPress={() =>
                              handleShareQris(qrisKey, item.reference)
                            }
                          >
                            <Ionicons
                              name="download-outline"
                              size={16}
                              color="#ffffff"
                            />
                            <Text style={styles.qrisPrimaryText}>
                              Simpan QR
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.qrisSecondaryButton}
                            onPress={fetchPendingQris}
                          >
                            <Ionicons
                              name="refresh"
                              size={16}
                              color="#3a2f00"
                            />
                            <Text style={styles.qrisSecondaryText}>
                              Cek Status
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyStateText}>
              Tidak ada pembayaran yang belum selesai.
            </Text>
          )}
        </View>
      );
    } else if (selectedTab === "Selesai") {
      const grouped = completedTrx.reduce(
        (acc: Record<string, any[]>, item: any) => {
          const key = item.reference || String(item.trx_num || "unknown");
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        },
        {}
      );
      const completedGroups = Object.values(grouped).sort((a: any[], b: any[]) => {
        const dateA = Date.parse(a?.[0]?.create_date || "");
        const dateB = Date.parse(b?.[0]?.create_date || "");
        return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
      });
      const pageSize = 10;
      const visibleGroups = completedGroups.slice(0, completedPage * pageSize);
      return (
        <View style={[styles.sectionSpacing, styles.historyListWrapper]}>
          {visibleGroups.length > 0 ? (
            visibleGroups.map((items: any[], index: number) => {
              const header = items[0] || {};
              const receiptKey = String(header.reference || header.trx_num || index);
              return (
                <View key={index} style={styles.paymentCardShell}>
                  <ViewShot
                    ref={(ref) => {
                      completedShotRefs.current[receiptKey] = ref;
                    }}
                    style={[styles.paymentCard, styles.historyCard]}
                  >
                    <View style={styles.historyHeaderRow}>
                      <Text style={styles.historyTitle}>
                        {header.group_name || "Nama Toko"}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          (() => {
                            const status = String(
                              header.qris_status || ""
                            ).toUpperCase();
                            if (status === "EXPIRE" || status === "EXPIRED") {
                              return styles.statusPillExpired;
                            }
                            if (status === "PENDING") {
                              return styles.statusPillPending;
                            }
                            return styles.statusPillSuccess;
                          })(),
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            (() => {
                              const status = String(
                                header.qris_status || ""
                              ).toUpperCase();
                              if (status === "EXPIRE" || status === "EXPIRED") {
                                return styles.statusExpire;
                              }
                              if (status === "PENDING") {
                                return styles.statusPending;
                              }
                              return styles.statusSettlement;
                            })(),
                          ]}
                        >
                          {header.qris_status || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historySubtitle}>
                      {header.slogan || "Slogan Toko"}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {header.alamat_store || "Alamat Toko"}
                    </Text>

                    <View style={styles.historyDivider} />
                    <View style={styles.historyInfoRow}>
                      <Text style={styles.historyLabel}>No Transaksi</Text>
                      <Text style={styles.historyValue}>
                        {header.trx_num || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.historyInfoRow}>
                      <Text style={styles.historyLabel}>Reference</Text>
                      <Text style={styles.historyValue}>
                        {header.reference || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionText}>
                        Store: {header.name_store || "N/A"}
                      </Text>
                      <Text style={styles.transactionText}>
                        Member: {header.user_name || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.productList}>
                      {items.map((item: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <View style={styles.productItem}>
                            <Text style={styles.productName}>
                              {idx + 1}. {item.name_produk}
                            </Text>
                          </View>
                          <View style={styles.productDetails}>
                            <Text style={styles.productQty}>Qty: {item.qty}</Text>
                            <Text style={styles.productPrice}>
                              Harga: Rp{" "}
                              {item.price?.toLocaleString("id-ID") || "0"}
                            </Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>

                    <Text style={styles.detailRow}>
                      Tanggal:{" "}
                      {header.create_date
                        ? new Date(header.create_date).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Tanggal tidak tersedia"}
                    </Text>
                    <View style={styles.historyFeeRow}>
                      <Text style={styles.historyFeeLabel}>
                        Biaya penanganan
                      </Text>
                      <Text style={styles.historyFeeValue}>
                        Rp{" "}
                        {(() => {
                          const baseTotal =
                            header.total ?? header.sub_total ?? 0;
                          return Math.round(baseTotal * 0.007).toLocaleString(
                            "id-ID"
                          );
                        })()}
                      </Text>
                    </View>
                    <View style={styles.historyTotalRow}>
                      <Text style={styles.historyTotalLabel}>Total</Text>
                      <Text style={styles.historyTotalValue}>
                        Rp{" "}
                        {header.total?.toLocaleString("id-ID") ||
                          header.sub_total?.toLocaleString("id-ID") ||
                          "0"}
                      </Text>
                    </View>
                  </ViewShot>
                  <TouchableOpacity
                    style={styles.historyShareButton}
                    onPress={() => handleShareReceipt(receiptKey)}
                  >
                    <Ionicons name="share-social" size={16} color="#ffffff" />
                    <Text style={styles.historyShareText}>Share Struk</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyStateText}>
              Tidak ada pembayaran yang selesai.
            </Text>
          )}
          {completedGroups.length > visibleGroups.length && (
            <TouchableOpacity
              style={styles.historyLoadMore}
              onPress={() => setCompletedPage((prev) => prev + 1)}
            >
              <Text style={styles.historyLoadMoreText}>Muat lebih banyak</Text>
            </TouchableOpacity>
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
            onPress={() => {
              setSelectedTab("Belum Bayar");
              fetchPendingQris();
            }}
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
                  <View style={styles.paymentMethodRow}>
                    <Text style={styles.paymentMethodLabel}>Metode Pembayaran</Text>
                    <TouchableOpacity
                      style={styles.paymentMethodButton}
                      onPress={() => setPaymentMethodModalVisible(true)}
                    >
                      <Text style={styles.paymentMethodValue}>
                        {selectedPaymentMethod}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color="#de0866"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalText}>
                      Rp{totalPrice.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Biaya penanganan</Text>
                    <Text style={styles.feeValue}>
                      Rp{handlingFee.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                    <Text style={styles.grandTotalValue}>
                      Rp{grandTotal.toLocaleString()}
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
          visible={isPaymentMethodModalVisible}
          animationType="slide"
          onRequestClose={() => setPaymentMethodModalVisible(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetOverlay}
              activeOpacity={1}
              onPress={() => setPaymentMethodModalVisible(false)}
            />
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Pilih Metode Pembayaran</Text>
              {paymentMethods.map((method) => {
                const isEnabled = method === "QRIS" || method === "Saving";
                return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.sheetOption,
                    selectedPaymentMethod === method && styles.sheetOptionActive,
                    !isEnabled && styles.sheetOptionDisabled,
                  ]}
                  onPress={() => {
                    if (!isEnabled) return;
                    setSelectedPaymentMethod(method);
                    setPaymentMethodModalVisible(false);
                  }}
                  disabled={!isEnabled}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      selectedPaymentMethod === method &&
                        styles.sheetOptionTextActive,
                      !isEnabled && styles.sheetOptionTextDisabled,
                    ]}
                  >
                    {method === "Saving"
                      ? `Saving - Rp ${Number(profil?.saving || 0).toLocaleString()}`
                      : method}
                  </Text>
                  {selectedPaymentMethod === method && (
                    <Ionicons name="checkmark" size={18} color="#de0866" />
                  )}
                </TouchableOpacity>
              )})}
            </View>
          </View>
        </Modal>
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
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentMethodLabel: {
    fontSize: 12,
    color: "#7a7a7a",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  paymentMethodValue: {
    fontSize: 13,
    color: "#de0866",
    fontWeight: "700",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingTop: 10,
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
    fontSize: 14,
    fontWeight: "700",
    color: "#3a2f00",
    marginBottom: 12,
    textAlign: "center",
  },
  sheetOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  sheetOptionActive: {
    borderColor: "#ffd24d",
    backgroundColor: "#fff6d6",
  },
  sheetOptionDisabled: {
    borderColor: "#f0f0f0",
    backgroundColor: "#f7f7f7",
  },
  sheetOptionText: {
    fontSize: 14,
    color: "#3a2f00",
    fontWeight: "600",
  },
  sheetOptionTextActive: {
    color: "#de0866",
  },
  sheetOptionTextDisabled: {
    color: "#9a9a9a",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 12,
    color: "#7a7a7a",
    fontWeight: "600",
  },
  feeValue: {
    fontSize: 12,
    color: "#3a2f00",
    fontWeight: "700",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  grandTotalLabel: {
    fontSize: 14,
    color: "#3a2f00",
    fontWeight: "700",
  },
  grandTotalValue: {
    fontSize: 16,
    color: "#de0866",
    fontWeight: "800",
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
  qrisLabelCenter: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b3a00",
    marginTop: 6,
    marginBottom: 4,
    textAlign: "center",
  },
  qrisCardLite: {
    marginTop: 12,
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  qrisImagePreview: {
    width: 240,
    height: 240,
    resizeMode: "contain",
  },
  qrisShot: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  qrisStatusText: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
    color: "#de0866",
  },
  qrisStatusExpired: {
    color: "#d7263d",
  },
  qrisStatusPending: {
    color: "#f4b400",
  },
  qrisStatusSuccess: {
    color: "#1b8f3a",
  },
  qrisExpiryText: {
    fontSize: 12,
    color: "#7a7a7a",
  },
  qrisTimerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3a2f00",
    marginTop: 4,
  },
  qrisActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  qrisPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#e21864",
  },
  qrisPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  qrisSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#fff6d6",
  },
  qrisSecondaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b3a00",
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
  historyCard: {
    paddingTop: 16,
  },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4b2d00",
    flex: 1,
  },
  historySubtitle: {
    fontSize: 13,
    color: "#7a5c00",
    marginTop: 6,
  },
  historyMeta: {
    fontSize: 12,
    color: "#a07c18",
    marginTop: 2,
  },
  historyDivider: {
    height: 1,
    backgroundColor: "#f1e2b8",
    marginVertical: 12,
  },
  historyInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historyLabel: {
    fontSize: 12,
    color: "#7a5c00",
  },
  historyValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3a2f00",
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
  historyTotalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1e2b8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyFeeRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyFeeLabel: {
    fontSize: 12,
    color: "#7a5c00",
  },
  historyFeeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3a2f00",
  },
  historyTotalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3a2f00",
  },
  historyTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1b8f3a",
  },
  historyShareButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#e21864",
  },
  historyShareText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  historyLoadMore: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#fff6d6",
    borderWidth: 1,
    borderColor: "#f1d18a",
  },
  historyLoadMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b3a00",
  },
  statusPill: {
    backgroundColor: "rgba(255,195,0,0.12)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusPillExpired: {
    backgroundColor: "rgba(215,38,61,0.12)",
  },
  statusPillPending: {
    backgroundColor: "rgba(245,165,36,0.16)",
  },
  statusPillSuccess: {
    backgroundColor: "rgba(28,141,58,0.12)",
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
