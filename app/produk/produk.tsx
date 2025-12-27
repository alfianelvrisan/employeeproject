import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Modal,
  RefreshControl,
  ImageSourcePropType,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  fetchProducts,
  fetchCategories,
  sendLike,
} from "../../services/productService";
import { fetchProfile } from "../../services/profileServices";
import { fetchDeliveryServices } from "../../services/deliveryServices";

const PRIMARY_YELLOW = "#ffe133";
const PRIMARY_YELLOW_LIGHT = "#fff3b0";
const PRIMARY_YELLOW_SOFT = "#fff8d7";
const PRIMARY_TEXT_DARK = "#3a2f00";
const PRIMARY_TEXT_MUTED = "#6f5a1a";
const PRIMARY_SHADOW = "rgba(255, 199, 0, 0.35)";
const CATEGORY_ICON_BASE_URL = "https://api.laskarbuah.com"; // API icon sering berupa path relatif tanpa domain

const CATEGORY_ICON_MAP: Record<string, ImageSourcePropType> = {
  "buah lokal": require("../../assets/icons/buah_lokal.png"),
  "buah import": require("../../assets/icons/buah_import.png"),
  sayuran: require("../../assets/icons/sayuran.png"),
  vegetables: require("../../assets/icons/vegetables.png"),
  vegetable: require("../../assets/icons/vegetables.png"),
  snack: require("../../assets/icons/snack.png"),
  roti: require("../../assets/icons/roti.png"),
  minuman: require("../../assets/icons/minuman.png"),
  frozen: require("../../assets/icons/frozen_food.png"),
  grosir: require("../../assets/icons/grosir.png"),
};

const getLocalIconByLabel = (label: string) => {
  const normalized = label.toLowerCase();
  const match = Object.keys(CATEGORY_ICON_MAP).find((key) =>
    normalized.includes(key)
  );
  return match ? CATEGORY_ICON_MAP[match] : CATEGORY_ICON_MAP["sayuran"];
};

type ProdukProps = {
  idStore: any;
  searchQuery?: string;
  showSearchBar?: boolean;
};

const getCategoryIcon = (item: any) => {
  const label = item?.kategory || item?.nama_kategori || "";
  const rawIcon = (item?.icon || item?.icon_url || "").toString().trim();

  if (rawIcon) {
    if (/^(https?:)?\/\//i.test(rawIcon) || rawIcon.startsWith("data:")) {
      return { uri: rawIcon };
    }

    const sanitized = rawIcon.replace(/\\/g, "/").replace(/^\/+/, "");
    return { uri: `${CATEGORY_ICON_BASE_URL}/${sanitized}` };
  }

  return getLocalIconByLabel(label);
};

const Produk = ({
  idStore,
  searchQuery = "",
  showSearchBar = true,
}: ProdukProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);
  const [produck, setProducts] = useState<any[]>([]);
  const [categorys, setCategory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(searchQuery);
  const [showCartAlert, setShowCartAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userToken } = useAuth();
  const [idUser, setIdUser] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetchProfile(userToken || "");
        if (response) {
          setIdUser(response.id);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [userToken]);

  const fetchAndSetProducts = useCallback(async () => {
    if (!idStore || isLoading) return;
    setIsLoading(true);
    try {
      const products = await fetchProducts(idStore, 1, userToken || "", new Set<number>());
      setProducts(products); // Replace, no pagination
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [idStore, userToken, isLoading]);

  useEffect(() => {
    if (!idStore) return;
    fetchAndSetProducts();
  }, [idStore]);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!idStore) return;

    fetchCategories(idStore)
      .then((json) => setCategory(json))
      .catch((err) => console.error(err));
  }, [idStore]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAndSetProducts();
    setRefreshing(false);
  };

  const filteredProducts = useMemo(() => {
    return produck.filter((p) => {
      const matchCategory =
        selectedCategory === 0 || p.categoryid === selectedCategory;
      const matchSearch =
        search === "" ||
        p.name_produk?.toLowerCase().includes(search.toLowerCase()) ||
        p.cate?.toLowerCase().includes(search.toLowerCase()) ||
        p.name_store?.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [produck, search, selectedCategory]);

  const handleLikePress = async (productId: number) => {
    const isLiked =
      likedProducts.includes(productId) ||
      produck.find((p) => p.id === productId)?.liked !== 0;

    setLikedProducts((prev) =>
      isLiked ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? {
            ...product,
            likes: isLiked ? product.likes - 1 : product.likes + 1,
            liked: isLiked ? 0 : 1,
          }
          : product
      )
    );

    try {
      await sendLike(userToken || "", productId, idStore);
      // Sinkronkan kembali dengan data server agar hitungan like konsisten antar pengguna
      await fetchAndSetProducts();
    } catch (error) {
      console.error("Failed to like/unlike product:", error);
      setLikedProducts((prev) =>
        isLiked ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? {
              ...product,
              likes: isLiked ? product.likes + 1 : product.likes - 1,
              liked: isLiked ? 1 : 0,
            }
            : product
        )
      );
    }
  };

  const handleAddToCart = useCallback(
    async (id: any) => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        if (idUser === null) {
          alert("Terjadi kesalahan. Silakan coba lagi.");
          return;
        }

        const response = await fetchDeliveryServices(
          id,
          idStore,
          idUser,
          userToken || ""
        );

        if (response) {
          if (
            Array.isArray(response) &&
            response[0]?.corp_api_save_trx_member === 1
          ) {
            setShowCartAlert(true);
            setTimeout(() => {
              setShowCartAlert(false);
            }, 1000);
          } else if (
            response[0]?.corp_api_save_trx_member === 0 ||
            response[0]?.corp_api_save_trx_member === 99
          ) {
            alert("Gagal menambahkan ke keranjang. Silakan coba lagi.");
          } else {
            console.error("Unexpected response format:", response);
            alert("Terjadi kesalahan. Silakan coba lagi.");
          }
        } else {
          console.error("No response received from delivery services.");
          alert("Terjadi kesalahan. Silakan coba lagi.");
        }
      } catch (error) {
        console.error("Error fetching delivery services:", error);
        alert("Terjadi kesalahan. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    },
    [idUser, idStore, userToken, isLoading]
  );

  const renderFooter = () => {
    if (isLoading && produck.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          {[...Array(4)].map((_, index) => (
            <View key={index} style={styles.loadingCard}>
              <View style={styles.loadingImage} />
              <View style={styles.loadingText} />
              <View style={styles.loadingTextSmall} />
            </View>
          ))}
        </View>
      );
    }
    return null;
  };


  return (
    <View style={styles.container}>
      {/* Alert Keranjang */}
      <Modal
        transparent={true}
        visible={showCartAlert}
        animationType="fade"
        onRequestClose={() => setShowCartAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <Ionicons name="checkmark-circle" size={50} color="green" />
            <Text style={styles.alertText}>
              Produk berhasil dimasukkan ke keranjang
            </Text>
          </View>
        </View>
      </Modal>

      {showSearchBar && (
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={PRIMARY_TEXT_MUTED}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchBar}
            placeholder="Search something..."
            placeholderTextColor={PRIMARY_TEXT_MUTED}
            value={search}
            onChangeText={(text) => setSearch(text)}
          />
        </View>
      )}
      <FlatList
        horizontal
        data={categorys}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryBadge,
              selectedCategory === item.id && styles.selectedCategoryBadge,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <View style={styles.iconContainer}>
              <Image source={getCategoryIcon(item)} style={styles.icons} />
            </View>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.id && styles.selectedCategoryText,
              ]}
            >
              {item.kategory || "Unknown Category"}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.categoryContainer}
        showsHorizontalScrollIndicator={false}
      />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        onEndReached={fetchAndSetProducts}
        onEndReachedThreshold={0.8}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        } // Add RefreshControl
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => {
              const storeParam =
                idStore ||
                item.id_store ||
                item.store_id ||
                item.storeid ||
                item.idStore;

              console.log("Navigating to produkDetail with:", {
                detailId: item.id,
                idStore: storeParam,
                nameProduk: item.name_produk,
              });

              router.push(
                `/produk/produkDetail?detailId=${item.id}&idStore=${storeParam}&nameProduk=${encodeURIComponent(item.name_produk)}&idProduk=${item.id}`
              );
            }}
          >
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.foto }} style={styles.productImage} />
              {item.discount !== 0 ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{Math.round((item.discount / item.price) * 100)}%
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.productInfo}>
              <Text
                style={styles.productName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.9}
              >
                {item.name_produk}
              </Text>

              <View style={styles.storeRow}>
                <View style={styles.storeChip}>
                  <Ionicons name="storefront-outline" size={12} color={PRIMARY_TEXT_DARK} />
                  <Text style={styles.storeText} numberOfLines={1}>
                    {item.name_store}
                  </Text>
                </View>
                <Text style={styles.categoryPill} numberOfLines={1}>
                  {item.cate}
                </Text>
              </View>

              <Text style={styles.productUOM}>{item.uom}</Text>

              <View style={styles.priceRow}>
                {item.discount !== 0 ? (
                  <>
                    <Text style={styles.productPriceDiscount}>
                      Rp {(item.price - item.discount).toLocaleString()}
                    </Text>
                    <Text style={styles.productPriceOriginal}>
                      Rp {item.price.toLocaleString()}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.productPrice}>
                    Rp {item.price.toLocaleString()}
                  </Text>
                )}
              </View>

              <View style={styles.actionContainer}>
                <TouchableOpacity
                  onPress={() => handleAddToCart(item.id)}
                  style={styles.actionButton}
                >
                  <Ionicons name="cart-outline" size={18} color={PRIMARY_TEXT_DARK} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleLikePress(item.id)}
                  style={styles.actionButton}
                >
                  <Ionicons
                    name={
                      likedProducts.includes(item.id) || item.liked !== 0
                        ? "heart"
                        : "heart-outline"
                    }
                    size={18}
                    color={
                      likedProducts.includes(item.id) || item.liked !== 0
                        ? "red"
                        : PRIMARY_TEXT_DARK
                    }
                  />
                </TouchableOpacity>
                <Text style={styles.totalLikesText}>
                  {item.likes !== 0 ? `${item.likes} Likes` : "Belum ada Like"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
    marginBottom: 140,
  },
  categoryContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  categoryBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_YELLOW_SOFT,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: PRIMARY_YELLOW_LIGHT,
    shadowColor: PRIMARY_SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 0.1,
    width: 100,
    height: 50,
  },
  selectedCategoryBadge: {
    backgroundColor: PRIMARY_YELLOW,
    borderColor: PRIMARY_YELLOW,
    shadowOpacity: 0.4,
    elevation: 4,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  icons: {
    width: 20,
    height: 20,
    alignItems: "center",
  },
  categoryText: {
    fontSize: 10,
    opacity: 0.9,
    color: PRIMARY_TEXT_DARK,
    textAlign: "center",
  },
  selectedCategoryText: {
    color: PRIMARY_TEXT_DARK,
    fontWeight: "700",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  productCard: {
    backgroundColor: PRIMARY_YELLOW_SOFT,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,225,51,0.4)",
    shadowColor: PRIMARY_SHADOW,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    width: "49%",
  },
  imageWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  productImage: {
    width: "100%",
    height: 140,
    resizeMode: "contain",
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: PRIMARY_YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  discountText: {
    color: PRIMARY_TEXT_DARK,
    fontSize: 12,
    fontWeight: "700",
  },
  productInfo: {
    marginBottom: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: PRIMARY_TEXT_DARK,
    flexShrink: 1,
  },
  storeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  storeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_YELLOW_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: "70%",
  },
  storeText: {
    fontSize: 12,
    color: PRIMARY_TEXT_DARK,
    marginLeft: 6,
    flexShrink: 1,
  },
  categoryPill: {
    backgroundColor: "#fff4c4",
    color: PRIMARY_TEXT_MUTED,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: 11,
    maxWidth: "42%",
    textAlign: "right",
    flexShrink: 1,
  },
  productUOM: {
    fontSize: 12,
    color: PRIMARY_TEXT_MUTED,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY_TEXT_DARK,
  },
  productPriceOriginal: {
    fontSize: 12,
    color: "rgba(58,47,0,0.5)",
    textDecorationLine: "line-through",
  },
  productPriceDiscount: {
    fontSize: 16,
    color: PRIMARY_TEXT_DARK,
    fontWeight: "700",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PRIMARY_YELLOW_LIGHT,
    borderWidth: 1,
    borderColor: "rgba(255,225,51,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  totalLikesText: {
    fontSize: 11,
    color: PRIMARY_TEXT_MUTED,
    marginLeft: "auto",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fffef6",
    borderWidth: 1,
    borderColor: "rgba(255,225,51,0.45)",
    elevation: 6,
    shadowColor: PRIMARY_SHADOW,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: PRIMARY_TEXT_DARK,
  },
  searchIcon: {
    marginRight: 12,
    color: PRIMARY_TEXT_DARK,
  },
  searchResult: {
    marginTop: 10,
    fontSize: 14,
    color: PRIMARY_TEXT_DARK,
  },
  loadingContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 0,
  },
  loadingCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    width: "49%", // Sama dengan card produk asli
    height: 300, // Sama dengan card produk asli
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0.1,
  },
  loadingImage: {
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    width: "100%",
    height: 120, // Sama dengan tinggi gambar pada card produk asli
    marginBottom: 10,
  },
  loadingText: {
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    width: "70%",
    height: 10,
    marginBottom: 5,
  },
  loadingTextSmall: {
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    width: "50%",
    height: 10,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  alertContainer: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  alertText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
});

export default Produk;
