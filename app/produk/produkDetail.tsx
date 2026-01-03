import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, SearchParams, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { fetchProdukDetail } from "../../services/ProdukDetail";
// import { useSearchParams } from "expo-router/build/hooks";
import { useLocalSearchParams } from "expo-router";
import { fetchProducts, sendLike } from "../../services/productService"; // Import fetchProducts
import { fetchDeliveryServices } from "../../services/deliveryServices"; // Import fetchDeliveryServices
import CustomHeader from "../../components/CustomWithbackground";


const ProdukDetail = () => {
  console.log(">>>> RENDER CYCLE START: ProdukDetail (AuthProvider Removed) <<<<");
  const { detailId, idStore: idStoreParam, idProduk: idProdukParam } = useLocalSearchParams<{ detailId: string, idStore: string, idProduk: string }>();
  const insets = useSafeAreaInsets();

  console.log("ProdukDetail Params:", { detailId, idStoreParam, idProdukParam });

  const productIdNumber = useMemo(() => {
    const raw = idProdukParam ?? detailId;
    if (!raw || raw === "undefined") return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [idProdukParam, detailId]);
  const storeIdFromParam = useMemo(
    () => Number(idStoreParam || 0),
    [idStoreParam]
  );

  const { userToken, fetchProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCartAlert, setShowCartAlert] = useState(false);
  const [products, setProducts] = useState<
    {
      id: number;
      categoryid: number;
      foto: string;
      name_produk: string;
      cate: string;
      name_store: string;
      uom: string;
      price: number;
      discount: number;
      description: string;
      id_produk?: number;
      product_id?: number;
      idProduct?: number;
      id_store?: number;
      store_id?: number;
      storeid?: number;
      idStore?: number;
      image?: string;
      foto_produk?: string;
      img_url?: string;
      image_url?: string;
    }[]
  >([]);
  const [randomProducts, setRandomProducts] = useState<any[]>([]);
  const [idUser, setIdUser] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // random products loading
  const [detailLoading, setDetailLoading] = useState<boolean>(true);
  const resolveImage = useCallback((prod: any) => {
    return (
      prod?.foto ||
      prod?.image ||
      prod?.foto_produk ||
      prod?.img_url ||
      prod?.image_url ||
      ""
    );
  }, []);

  const selectedProduct = useMemo(() => {
    const targetId = Number(detailId);
    console.log(`Calculating selectedProduct for id: ${targetId}, products count: ${products.length}`);
    return (
      products.find(
        (product) =>
          product.id === targetId ||
          product.id_produk === targetId ||
          product.product_id === targetId ||
          product.idProduct === targetId
      ) || products[0]
    );
  }, [products, detailId]);

  const effectiveStoreId = useMemo(() => {
    if (storeIdFromParam) return storeIdFromParam;
    const fallback =
      selectedProduct?.id_store ||
      selectedProduct?.store_id ||
      selectedProduct?.storeid ||
      selectedProduct?.idStore;
    return fallback ? Number(fallback) : 0;
  }, [storeIdFromParam, selectedProduct]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetchProfile();
        if (response?.id) {
          setIdUser(response.id);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [userToken]);

  console.log(idUser);
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!storeIdFromParam || !productIdNumber) {
          console.warn("idStore atau idProduk tidak ditemukan.");
          setDetailLoading(false);
          return;
        }

        setDetailLoading(true);
        const response = await fetchProdukDetail(
          storeIdFromParam,
          productIdNumber,
          String(userToken)
        );
        if (response) {
          console.log("Fetch Data Response:", JSON.stringify(response).slice(0, 200)); // Log part of response
          // Normalisasi agar selalu ada properti id untuk pemetaan produk utama
          const normalized = response.map((item: any) => {
            const fotoLength = item.foto ? item.foto.length : 0;
            console.log(`Product ${item.id ?? item.name_produk} foto length: ${fotoLength}`);

            // Safety check for massive base64 strings that might crash the bridge
            let safeFoto = item.foto;
            if (fotoLength > 1000000) { // 1MB+ string
              console.warn("Foto is too large, replacing with placeholder to prevent crash");
              safeFoto = null;
            }

            return {
              ...item,
              foto: safeFoto,
              id:
                item.id ??
                item.id_produk ??
                item.product_id ??
                item.detail_id ??
                item.idProduct,
            }
          });
          console.log("Setting products state with length:", normalized.length);
          setProducts(normalized);
        } else {
          console.warn("Data produk tidak ditemukan: Response is null/undefined");
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setDetailLoading(false);
      }
    };

    console.log("Fetch Data Triggered. storeId:", storeIdFromParam, "productId:", productIdNumber);

    fetchData();

    return () => {
      setProducts([]);
    };
  }, [storeIdFromParam, idProdukParam, detailId, productIdNumber]);

  useEffect(() => {
    const fetchRandomProducts = async () => {
      try {
        if (!effectiveStoreId) {
          console.warn("idStore tidak ditemukan.");
          return;
        }

        setLoading(true); // Start loading
        const allProducts = await fetchProducts(
          String(effectiveStoreId),
          1,
          userToken || "",
          new Set<number>(),
          20
        );
        const shuffled = allProducts.sort(() => 0.5 - Math.random());
        setRandomProducts(shuffled.slice(0, 10)); // Select 10 random products
      } catch (error) {
        console.error("Error fetching random products:", error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchRandomProducts();
  }, [effectiveStoreId, userToken]);


  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  const getProductId = (product: any) =>
    Number(product?.id ?? product?.id_produk ?? product?.idProduct);

  const handleLikePress = async (product: any) => {
    const productId = getProductId(product);
    const storeId = Number(
      product?.id_store ?? product?.store_id ?? product?.storeid ?? effectiveStoreId
    );
    if (!Number.isFinite(productId) || !Number.isFinite(storeId)) {
      console.warn("Like gagal: id produk/store tidak valid", { productId, storeId });
      return;
    }
    try {
      const result = await sendLike(userToken || "", productId, storeId);
      const didLike = result?.action === "liked";
      setRandomProducts((prevProducts) =>
        prevProducts.map((item) =>
          getProductId(item) === productId
            ? {
                ...item,
                likes: didLike
                  ? Number(item.likes || 0) + 1
                  : Math.max(0, Number(item.likes || 0) - 1),
                liked: didLike ? 1 : 0,
              }
            : item
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
      if (isLoading) return; // Prevent multiple clicks while loading
      setIsLoading(true);
      try {
        if (!effectiveStoreId) {
          alert("Terjadi kesalahan. Silakan coba lagi.");
          return;
        }
        const response = await fetchDeliveryServices(
          id,
          effectiveStoreId,
          Number(idUser),
          userToken || ""
        );
        if (response) {
          if (
            Array.isArray(response) &&
            response[0]?.corp_api_save_trx_member === 1
          ) {
            console.log("Delivery Services Success:", response);
            setShowCartAlert(true); // Show success alert
            setTimeout(() => {
              setShowCartAlert(false); // Hide alert after 2 seconds
            }, 2000);
          } else {
            console.error("Delivery Services Failed:", response);
            alert("Gagal menambahkan ke keranjang. Silakan coba lagi.");
          }
        } else {
          console.error("No response received from delivery services.");
          alert("Terjadi kesalahan. Silakan coba lagi.");
        }
      } catch (error) {
        console.error("Error fetching delivery services:", error);
        alert("Terjadi kesalahan. Silakan coba lagi.");
      } finally {
        setIsLoading(false); // Reset loading state
      }
    },
    [effectiveStoreId, idUser, userToken, isLoading]
  );



  const handleAddMainProductToCart = useCallback(async () => {
    if (!selectedProduct || isLoading) return;
    setIsLoading(true);
    try {
      if (!effectiveStoreId) {
        alert("Terjadi kesalahan. Silakan coba lagi.");
        return;
      }
      const response = await fetchDeliveryServices(
        selectedProduct.id,
        effectiveStoreId,
        Number(idUser),
        userToken || ""
      );
      if (response) {
        if (
          Array.isArray(response) &&
          response[0]?.corp_api_save_trx_member === 1
        ) {
          console.log("Delivery Services Success:", response);
          setShowCartAlert(true); // Show success alert
          setTimeout(() => {
            setShowCartAlert(false); // Hide alert after 2 seconds
          }, 2000);
        } else {
          console.error("Delivery Services Failed:", response);
          alert("Gagal menambahkan ke keranjang. Silakan coba lagi.");
        }
      } else {
        console.error("No response received from delivery services.");
        alert("Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error fetching delivery services:", error);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }, [selectedProduct, effectiveStoreId, idUser, userToken, isLoading]);

  const renderFooter = () =>
    isLoading ? (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <View style={styles.loadingImage} />
          <View style={styles.loadingText} />
          <View style={styles.loadingTextSmall} />
        </View>
      </View>
    ) : null;

  const renderMainProduct = () => {
    console.log("Rendering Main Product. Loading:", loading, "SelectedProduct:", selectedProduct ? "Found" : "Missing");
    if (detailLoading) {
      return (
        <View style={styles.skeletonMainProduct}>
          <View style={styles.skeletonMainImage} />
          <View style={styles.skeletonMainText} />
          <View style={styles.skeletonMainTextSmall} />
          <View style={styles.skeletonMainTextSmall} />
        </View>
      );
    }
    if (!selectedProduct) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Produk tidak ditemukan.</Text>
        </View>
      );
    }

    console.log("Preparing to render Main Product View (Image, Details, etc)");
    return (
      <>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.slideshowContainer}
        >
          <Image
            source={
              resolveImage(selectedProduct)
                ? { uri: resolveImage(selectedProduct) }
                : {
                  uri: "https://via.placeholder.com/400x300?text=No+Image",
                }
            }
            style={styles.fullImage}
            resizeMode="contain"
          />
        </ScrollView>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{selectedProduct.name_produk}</Text>
          <Text style={styles.productPrice}>
            {Number(selectedProduct.discount) !== 0 ? (
              <>
                <Text style={styles.productPriceOriginal}>
                  Rp {Number(selectedProduct.price).toLocaleString()}
                </Text>{" "}
                <Text style={styles.productPriceDiscount}>
                  Rp{" "}
                  {(
                    Number(selectedProduct.price) - Number(selectedProduct.discount)
                  ).toLocaleString()}
                </Text>
              </>
            ) : (
              `Rp ${Number(selectedProduct.price).toLocaleString()}`
            )}
          </Text>
          <Text style={styles.cate}>
            {selectedProduct.cate} | {selectedProduct.uom}
          </Text>
          <Text style={styles.name_stores}>{selectedProduct.name_store}</Text>
          <Text style={styles.productDescription}>
            {selectedProduct.description || "Deskripsi tidak tersedia."}
          </Text>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddMainProductToCart}
            disabled={isLoading}
          >
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={20} color="#fff" />
            ) : (
              <Ionicons name="cart-outline" size={20} color="#fff" />
            )}
            <Text style={styles.addToCartText}>
              {isLoading ? "Loading..." : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (

    <SafeAreaProvider >
      <Stack.Screen
        options={{
          headerShown: false,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTitle: "",
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/cart/cart")}
            >
              <Ionicons name="cart" size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.customHeaderContainer, { paddingTop: insets.top + 10 }]}>
          <View style={styles.customHeaderShell}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
              <Ionicons name="arrow-back" size={18} color="#3a2f00" />
            </TouchableOpacity>

            <Text style={styles.headerTitleText} numberOfLines={1}>
              {selectedProduct ? selectedProduct.name_produk : "Detail Produk"}
            </Text>

            <TouchableOpacity onPress={() => router.push({ pathname: "/cart/cart", params: { tab: "List Belanja" } })} style={styles.headerIconButton}>
              <Ionicons name="cart-outline" size={18} color="#3a2f00" />
            </TouchableOpacity>
          </View>
        </View>

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

        <ScrollView style={styles.scrollView}>
          {renderMainProduct()}
          {/* Random Products Section */}
          <View style={styles.randomProductsContainer}>
            <Text style={styles.sectionTitle}>Produk Lainnya</Text>
            <View style={styles.randomProductsGrid}>
              {loading
                ? Array.from({ length: 6 }, (_, index) => (
                    <View key={`skeleton-${index}`} style={styles.skeletonProductCard}>
                      <View style={styles.skeletonProductImage} />
                      <View style={styles.skeletonProductText} />
                      <View style={styles.skeletonProductTextSmall} />
                    </View>
                  ))
                : (Array.isArray(randomProducts) ? randomProducts : []).map((product) => (
                  <TouchableOpacity
                    key={getProductId(product)}
                    style={styles.randomProductCard}
                    onPress={() => {
                      const storeParam =
                        effectiveStoreId ||
                        product.id_store ||
                        product.store_id ||
                        product.storeid ||
                        product.idStore;
                      const detailId = getProductId(product);
                      router.push(
                        `/produk/produkDetail?detailId=${detailId}&idStore=${storeParam}&nameProduk=${product.name_produk}&idProduk=${detailId}`
                      );
                    }}
                  >
                    <View style={styles.imageWrapper}>
                      <Image
                        source={
                          resolveImage(product)
                            ? { uri: resolveImage(product) }
                            : {
                              uri: "https://via.placeholder.com/300x200?text=No+Image",
                            }
                        }
                        style={styles.randomProductImage}
                        resizeMode="contain"
                      />
                      {product.discount !== 0 ? (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            -{Math.round((product.discount / product.price) * 100)}%
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.productInfo}>
                      <Text
                        style={styles.randomProductName}
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.9}
                      >
                        {product.name_produk}
                      </Text>

                      <View style={styles.storeRow}>
                        <View style={styles.storeChip}>
                          <Ionicons name="storefront-outline" size={12} color="#fff" />
                          <Text style={styles.storeText} numberOfLines={1}>
                            {product.name_store}
                          </Text>
                        </View>
                        <Text style={styles.categoryPill} numberOfLines={1}>
                          {product.cate}
                        </Text>
                      </View>

                      <Text style={styles.productUOM}>{product.uom}</Text>

                      <View style={styles.priceRow}>
                        {product.discount !== 0 ? (
                          <>
                            <Text style={styles.productPriceDiscount}>
                              Rp {(product.price - product.discount).toLocaleString()}
                            </Text>
                            <Text style={styles.productPriceOriginal}>
                              Rp {product.price.toLocaleString()}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.productPrice}>
                            Rp {product.price.toLocaleString()}
                          </Text>
                        )}
                      </View>

                      <View style={styles.actionContainer}>
                        <TouchableOpacity
                          onPress={() => handleAddToCart(product.id)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="cart-outline" size={18} color="#3a2f00" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleLikePress(product)}
                          style={styles.actionButton}
                        >
                          <Ionicons
                            name={
                              likedProducts.includes(getProductId(product)) ||
                              Number(product.liked) === 1
                                ? "heart"
                                : "heart-outline"
                            }
                            size={18}
                            color={
                              likedProducts.includes(getProductId(product)) ||
                              Number(product.liked) === 1
                                ? "red"
                                : "#3a2f00"
                            }
                          />
                        </TouchableOpacity>
                        <Text style={styles.totalLikesText}>
                          {Number(product.likes || 0)} Likes
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
          {renderFooter()}
        </ScrollView>
      </View>
    </SafeAreaProvider>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
  },
  slideshowContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  productDetails: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cate: {
    fontSize: 14,
    color: "#777",
    marginBottom: 4,
  },
  name_stores: {
    fontSize: 14,
    color: "#de0866",
    fontWeight: "600",
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 12,
  },
  randomProductsContainer: {
    marginTop: 16,
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1b2b40",
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    marginLeft: 10,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  alertText: {
    marginTop: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 0,
  },
  loadingCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    width: "49%",
    height: 300,
  },
  loadingImage: {
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    width: "100%",
    height: 120,
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
  // Replaced Product Card Styles
  productName: {
    fontSize: 20, // Keep this for Main Product
    fontWeight: "700",
    marginBottom: 6,
    color: "#1b2b40",
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
  randomProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  randomProductCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "49%",
    height: 310,
  },
  imageWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  randomProductImage: {
    width: "100%",
    height: 140,
    resizeMode: "contain",
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ffe133",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  discountText: {
    color: "#3a2f00",
    fontSize: 12,
    fontWeight: "700",
  },
  productInfo: {
    marginBottom: 10,
  },
  randomProductName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3a2f00",
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
    color: "#3a2f00",
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
    color: "#6f5a1a",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 6,
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
    justifyContent: "center",
    alignItems: "center",
  },
  totalLikesText: {
    fontSize: 11,
    color: "#6f1a1aff",
    marginLeft: "auto",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#de0866",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    alignSelf: "stretch",
  },
  addToCartButtonSmall: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  addToCartText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "600",
  },
  // Skeletons...
  skeletonProductCard: {
    backgroundColor: "#f4f8ff",
    borderRadius: 18,
    width: "48%",
    marginBottom: 16,
    padding: 12,
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  skeletonProductImage: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    backgroundColor: "#e9f1ff",
    marginBottom: 8,
  },
  skeletonProductText: {
    height: 15,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
    borderRadius: 5,
  },
  skeletonProductTextSmall: {
    height: 10,
    width: "60%",
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  skeletonMainProduct: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 0.1,
  },
  skeletonMainImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    marginBottom: 16,
  },
  skeletonMainText: {
    height: 20,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
    borderRadius: 5,
  },
  skeletonMainTextSmall: {
    height: 15,
    width: "60%",
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    marginBottom: 8,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#7a7a7a",
  },
  customHeaderContainer: {
    backgroundColor: "#fff247",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  customHeaderShell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3a2f00",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
});

export default ProdukDetail;
