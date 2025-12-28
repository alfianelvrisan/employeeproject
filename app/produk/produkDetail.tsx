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
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Stack, SearchParams, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { fetchProdukDetail } from "../../services/ProdukDetail";
// import { useSearchParams } from "expo-router/build/hooks";
import { useLocalSearchParams } from "expo-router";
import { fetchProducts } from "../../services/productService"; // Import fetchProducts
import { fetchDeliveryServices } from "../../services/deliveryServices"; // Import fetchDeliveryServices
import { fetchProfile } from "../../services/profileServices";
import CustomHeader from "../../components/CustomWithbackground";


const ProdukDetail = () => {
  console.log(">>>> RENDER CYCLE START: ProdukDetail (AuthProvider Removed) <<<<");
  const { detailId, idStore: idStoreParam, idProduk: idProdukParam } = useLocalSearchParams<{ detailId: string, idStore: string, idProduk: string }>();

  console.log("ProdukDetail Params:", { detailId, idStoreParam, idProdukParam });

  const productIdNumber = useMemo(
    () => Number(idProdukParam || detailId),
    [idProdukParam, detailId]
  );
  const storeIdFromParam = useMemo(
    () => Number(idStoreParam || 0),
    [idStoreParam]
  );

  const { userToken } = useAuth();
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
  const [loading, setLoading] = useState<boolean>(true); // Add loading state for random products
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
        const response = await fetchProfile(userToken || "");
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
          return;
        }

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
          new Set<number>()
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
    if (loading || !selectedProduct) {
      return (
        <View style={styles.skeletonMainProduct}>
          <View style={styles.skeletonMainImage} />
          <View style={styles.skeletonMainText} />
          <View style={styles.skeletonMainTextSmall} />
          <View style={styles.skeletonMainTextSmall} />
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
      <SafeAreaView style={styles.container}>
        {selectedProduct && <CustomHeader title={selectedProduct.name_produk} />}

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
                ? Array.from({ length: 6 }).map((_, index) => (
                  <View key={index} style={styles.skeletonProductCard}>
                    <View style={styles.skeletonProductImage} />
                    <View style={styles.skeletonProductText} />
                    <View style={styles.skeletonProductTextSmall} />
                  </View>
                ))
                : randomProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.randomProductCard}
                    onPress={() => {
                      const storeParam =
                        effectiveStoreId ||
                        product.id_store ||
                        product.store_id ||
                        product.storeid ||
                        product.idStore;
                      router.push(
                        `/produk/produkDetail?detailId=${product.id}&idStore=${storeParam}&nameProduk=${product.name_produk}&idProduk=${product.id}`
                      );
                    }}
                  >
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
                    <Text style={styles.randomProductName}>
                      {product.name_produk}
                    </Text>
                    {product.discount !== 0 ? (
                      <>
                        <Text style={styles.productPriceOriginal}>
                          Rp {product.price.toLocaleString()}
                        </Text>
                        <Text style={styles.productPriceDiscount}>
                          Rp {(product.price - product.discount).toLocaleString()}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.productPrice}>
                        Rp {product.price.toLocaleString()}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.addToCartButtonSmall}
                      onPress={() => handleAddToCart(product.id)}
                      disabled={isLoading || !idUser}
                    >

                      <Ionicons
                        name="cart-outline"
                        size={20}
                        color="#de0866"
                      />
                      {/* <Text style={styles.addToCartText}>Add to Cart</Text> */}
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
          {renderFooter()}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    padding: 16,
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
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "80%",
  },
  alertText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 16,
  },
  loadingCard: {
    height: 120,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 12,
  },
  loadingImage: {
    height: 60,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginBottom: 8,
  },
  loadingText: {
    height: 14,
    backgroundColor: "#ccc",
    borderRadius: 6,
    marginBottom: 4,
  },
  loadingTextSmall: {
    height: 10,
    width: "60%",
    backgroundColor: "#ccc",
    borderRadius: 6,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 0.1,
  },

  productName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    color: "#1b2b40",
  },

  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#de0866",
  },

  productPriceOriginal: {
    fontSize: 14,
    color: "#9aa4b4",
    textDecorationLine: "line-through",
  },

  productPriceDiscount: {
    fontSize: 18,
    color: "#de0866",
    fontWeight: "bold",
  },

  randomProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },

  randomProductCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "48%",
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  randomProductImage: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    resizeMode: "contain",
    marginBottom: 8,
    backgroundColor: "#fff",
  },

  randomProductName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1b2b40",
  },

  randomProductPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#de0866",
    marginBottom: 6,
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
});

export default ProdukDetail;
