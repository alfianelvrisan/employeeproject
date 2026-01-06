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
  StyleProp,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  fetchProducts,
  fetchCategories,
  sendLike,
} from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { fetchDeliveryServices } from "../../services/deliveryServices";

const PRIMARY_YELLOW = "#ffe133";
const PRIMARY_YELLOW_LIGHT = "#fff3b0";
const PRIMARY_YELLOW_SOFT = "#fff8d7";
const PRIMARY_TEXT_DARK = "#3a2f00";
const PRIMARY_TEXT_MUTED = "#6f5a1a";
const PRIMARY_SHADOW = "rgba(255, 199, 0, 0.35)";
const CATEGORY_ICON_BASE_URL = "https://api.laskarbuah.com"; // API icon sering berupa path relatif tanpa domain

const CATEGORY_ICON_MAP: Record<string, ImageSourcePropType> = {
  "buah lokal": require("../../assets/icons/Buah Lokal.png"),
  "buah import": require("../../assets/icons/Buah Impor.png"),
  "buah impor": require("../../assets/icons/Buah Impor.png"),
  sayuran: require("../../assets/icons/Sayuran Basah.png"),
  "sayuran basah": require("../../assets/icons/Sayuran Basah.png"),
  "sayuran kering": require("../../assets/icons/Sayuran Kering.png"),
  vegetables: require("../../assets/icons/Sayuran Basah.png"),
  vegetable: require("../../assets/icons/Sayuran Basah.png"),
  frozen: require("../../assets/icons/Frozen food.png"),
  telur: require("../../assets/icons/Telur.png"),
  konsinyasi: require("../../assets/icons/Konsinyasi.png"),
  production: require("../../assets/icons/Production.png"),
  semua: require("../../assets/icons/Semua.png"),
};

const getLocalIconByLabel = (label: string) => {
  const normalized = label.toLowerCase();
  const match = Object.keys(CATEGORY_ICON_MAP).find((key) =>
    normalized.includes(key)
  );
  return match ? CATEGORY_ICON_MAP[match] : null;
};

type ProdukProps = {
  idStore: any;
  searchQuery?: string;
  showSearchBar?: boolean;
  style?: StyleProp<ViewStyle>;
  initialLimit?: number;
  pageSize?: number;
  ListHeaderComponent?: React.ReactElement | null;
  onRefreshParent?: () => Promise<void>;
  onScroll?: (event: import("react-native").NativeSyntheticEvent<import("react-native").NativeScrollEvent>) => void;
  refreshEnabled?: boolean;
};

const getCategoryIcon = (item: any) => {
  const label = item?.kategory || item?.nama_kategori || "";

  // 1. Try Local First
  const localIcon = getLocalIconByLabel(label);
  if (localIcon) {
    return localIcon;
  }

  // 2. Try API Second
  const rawIcon = (item?.icon || item?.icon_url || "").toString().trim();
  if (rawIcon) {
    if (/^(https?:)?\/\//i.test(rawIcon) || rawIcon.startsWith("data:")) {
      return { uri: rawIcon };
    }

    const sanitized = rawIcon.replace(/\\/g, "/").replace(/^\/+/, "");
    return { uri: `${CATEGORY_ICON_BASE_URL}/${sanitized}` };
  }

  // 3. Fallback
  return CATEGORY_ICON_MAP["sayuran"];
};

const Produk = ({
  idStore,
  searchQuery = "",
  showSearchBar = true,
  style,
  initialLimit = 20,
  pageSize = 20,
  ListHeaderComponent,
  onRefreshParent,
  onScroll,
  refreshEnabled = true,
}: ProdukProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);
  const [produck, setProducts] = useState<any[]>([]);
  const [categorys, setCategory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(searchQuery);
  const [showCartAlert, setShowCartAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userToken, fetchProfile } = useAuth();
  const [idUser, setIdUser] = useState<number | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetchProfile();
        if (response) {
          setIdUser(response.id);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [userToken]);

  const getSelectedCategoryLabel = useCallback(() => {
    if (selectedCategory === 0) return "";
    const match = categorys.find((c) => c.id === selectedCategory);
    return match?.kategory || "";
  }, [selectedCategory, categorys]);

  const fetchAndSetProducts = useCallback(
    async (pageToLoad: number, append: boolean, useCache: boolean) => {
      if (!idStore || isLoading || isFetchingMore) return;
      append ? setIsFetchingMore(true) : setIsLoading(true);
      try {
        const vWhere = getSelectedCategoryLabel();
        const existingIds = append
          ? new Set(produck.map((p) => getProductId(p)))
          : new Set<number>();
        const products = await fetchProducts(
          idStore,
          pageToLoad,
          userToken || "",
          existingIds,
          pageSize,
          useCache,
          vWhere
        );
        setProducts((prev) => (append ? [...prev, ...products] : products));
        setHasMore(products.length >= pageSize);
        setPage(pageToLoad);
      } catch (err) {
        console.error(err);
      } finally {
        append ? setIsFetchingMore(false) : setIsLoading(false);
      }
    },
    [idStore, userToken, isLoading, isFetchingMore, produck, pageSize, getSelectedCategoryLabel]
  );

  useEffect(() => {
    if (!idStore) return;
    setPage(1);
    setHasMore(true);
    fetchAndSetProducts(1, false, true);
  }, [idStore, selectedCategory, categorys]);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!idStore) return;

    fetchCategories(idStore, userToken || "")
      .then((json) => setCategory(json))
      .catch((err) => console.error(err));
  }, [idStore]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (onRefreshParent) {
      await onRefreshParent();
    }
    setHasMore(true);
    await fetchAndSetProducts(1, false, false);
    setRefreshing(false);
  };

  // Filter Logic
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

  const displayedProducts = useMemo(() => {
    return filteredProducts;
  }, [filteredProducts]);

  const handleLoadMore = () => {
    if (!hasMore || isLoading || isFetchingMore) return;
    fetchAndSetProducts(page + 1, true, true);
  };

  const getProductId = (product: any) =>
    Number(product?.id ?? product?.id_produk ?? product?.idProduct);

  const handleLikePress = async (product: any) => {
    const productId = getProductId(product);
    const storeId = Number(
      product?.id_store ?? product?.store_id ?? product?.storeid ?? idStore
    );
    if (!Number.isFinite(productId) || !Number.isFinite(storeId)) {
      console.warn("Like gagal: id produk/store tidak valid", { productId, storeId });
      return;
    }
    try {
      const result = await sendLike(userToken || "", productId, storeId);
      const didLike = result?.action === "liked";
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          getProductId(product) === productId
            ? {
                ...product,
                likes: didLike
                  ? Number(product.likes || 0) + 1
                  : Math.max(0, Number(product.likes || 0) - 1),
                liked: didLike ? 1 : 0,
              }
            : product
        )
      );
      setLikedProducts((prev) =>
        didLike ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    } catch (error) {
      console.error("Failed to like/unlike product:", error);
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

  const renderInternalHeader = () => (
    <>
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
        contentContainerStyle={{ paddingHorizontal: 12 }}
        showsHorizontalScrollIndicator={false}
      />
    </>
  );

  return (
    <>
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

      <FlatList
        style={[styles.container, style]}
        contentContainerStyle={{ paddingBottom: 140 }}
        data={displayedProducts} // Use sliced data
        keyExtractor={(item, index) => `${getProductId(item)}-${index}`}
        numColumns={2}
        columnWrapperStyle={[styles.row, { paddingHorizontal: 12 }]}
        onEndReached={handleLoadMore} // Use local load more
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}
            {renderInternalHeader()}
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} enabled={refreshEnabled} />
        }
        onScroll={onScroll}
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

              const detailId = getProductId(item);
              console.log("Navigating to produkDetail with:", {
                detailId,
                idStore: storeParam,
                nameProduk: item.name_produk,
              });

              router.push(
                `/produk/produkDetail?detailId=${detailId}&idStore=${storeParam}&nameProduk=${encodeURIComponent(item.name_produk)}&idProduk=${detailId}`
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
                  <Ionicons name="storefront-outline" size={12} color="#fff" />
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
                  onPress={() => handleAddToCart(getProductId(item))}
                  style={styles.actionButton}
                >
                  <Ionicons name="cart-outline" size={18} color={PRIMARY_TEXT_DARK} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleLikePress(item)}
                  style={styles.actionButton}
                >
                  <Ionicons
                    name={
                      likedProducts.includes(getProductId(item)) ||
                      Number(item.liked) === 1
                        ? "heart"
                        : "heart-outline"
                    }
                    size={18}
                    color={
                      likedProducts.includes(getProductId(item)) ||
                      Number(item.liked) === 1
                        ? "red"
                        : PRIMARY_TEXT_DARK
                    }
                  />
                </TouchableOpacity>
                <Text style={styles.totalLikesText}>
                  {Number(item.likes || 0)} Likes
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    marginBottom: 140,
  },
  categoryContainer: {
    flexDirection: "row",
    marginBottom: 0,
  },
  categoryBadge: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5, // Reduced padding
    paddingHorizontal: 0, // Reduced padding
    marginRight: 15, // Adjusted margin
    marginBottom: 10,
    width: 80, // Slightly reduced width to fit more
  },
  selectedCategoryBadge: {
    // backgroundColor: PRIMARY_YELLOW, // Removed selection background
    // borderColor: PRIMARY_YELLOW,
    // shadowOpacity: 0.4,
    // elevation: 4,
  },
  iconContainer: {
    width: 60,
    height: 44, // Reduced height to hug icon closer
    // borderRadius: 30, 
    // backgroundColor: PRIMARY_YELLOW_SOFT, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0, // Removed margin to pull text closer
  },
  icons: {
    width: 40, // Increased icon size
    height: 40, // Increased icon size
    alignItems: "center",
    resizeMode: 'contain',
  },
  categoryText: {
    fontSize: 12, // Increased font size
    // opacity: 0.9,
    color: PRIMARY_TEXT_DARK,
    textAlign: "center",
    fontWeight: "700", // Bold text
    lineHeight: 16,
  },
  selectedCategoryText: {
    color: "#d4a000", // Slightly different color for active state if needed, or keep same
    fontWeight: "800",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 0,
  },
  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0", // Clean border, no shadow
    width: "49%",
    minHeight: 310,
    flexDirection: "column",
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
    flexGrow: 1,
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
    backgroundColor: "#de0866",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: "70%",
  },
  storeText: {
    fontSize: 11,
    color: "#ffffff",
    marginLeft: 6,
    fontWeight: "600",
    flexShrink: 1,
  },
  categoryPill: {
    backgroundColor: "#fff247",
    color: "#3a2f00", // Dark text for contrast on yellow
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: "600",
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
    color: "#de0866",
  },
  productPriceOriginal: {
    fontSize: 12,
    color: "rgba(58,47,0,0.5)",
    textDecorationLine: "line-through",
  },
  productPriceDiscount: {
    fontSize: 16,
    color: "#de0866",
    fontWeight: "700",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: "auto",
  },
  actionButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: PRIMARY_YELLOW_LIGHT, // Removed
    // borderWidth: 1, // Removed
    // borderColor: "rgba(255,225,51,0.5)", // Removed
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
