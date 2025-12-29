import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useNavigation, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../context/AuthContext";
import { fetchProducts } from "../../services/productService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_HEIGHT = SCREEN_HEIGHT;

type ReelBase = {
  id: string;
  title: string;
  description: string;
  source: any;
};

type ReelItem = ReelBase & { loopKey?: string; mirrorId?: string };

const DEFAULT_STORE_ID = "1";

export default function GiftReels() {
  const navigation = useNavigation<any>();
  const router = useRouter();
  const { userToken } = useAuth();
  const [reels, setReels] = useState<ReelBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loopIndex, setLoopIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isBadgeModalVisible, setBadgeModalVisible] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>("");
  const [modalItems, setModalItems] = useState<any[]>([]);
  const [isModalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<ReelItem>>(null);

  const loopedData: ReelItem[] = useMemo(() => {
    if (!reels.length) return [];
    const first = reels[0];
    const last = reels[reels.length - 1];
    return [
      { ...last, loopKey: `loop-tail-${last.id}`, mirrorId: last.id },
      ...reels.map((item) => ({ ...item, loopKey: `main-${item.id}`, mirrorId: item.id })),
      { ...first, loopKey: `loop-head-${first.id}`, mirrorId: first.id },
    ];
  }, [reels]);

  useEffect(() => {
    const parent = navigation.getParent?.();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    const unsubFocus = navigation.addListener("focus", () => setIsPaused(false));
    const unsubBlur = navigation.addListener("blur", () => setIsPaused(true));
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
      unsubFocus?.();
      unsubBlur?.();
    };
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;
    const fetchReels = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://api.laskarbuah.com/api/ListProdukFoto");
        const json = await res.json();
        if (!isMounted) return;
        const filtered: ReelBase[] = (json || [])
          .filter((item: any) => {
            const foto = typeof item?.foto === "string" ? item.foto : "";
            const kategori = typeof item?.nama_kategori === "string" ? item.nama_kategori.toLowerCase() : "";
            const isVideoCategory = kategori === "vidio";
            const isMp4 = foto.toLowerCase().endsWith(".mp4");
            return isVideoCategory && isMp4;
          })
          .map((item: any) => ({
            id: String(item.id_produk ?? item.kode_produk ?? Math.random()),
            title: item.name_produk ?? "Video",
            description: item.nama_kategori ?? "Vidio",
            source: { uri: item.foto },
          }));
        setReels(filtered);
        setError(null);
      } catch (err: any) {
        if (isMounted) {
          setError("Gagal memuat video");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchReels();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const initial: Record<string, number> = {};
    reels.forEach((item, idx) => {
      initial[item.id] = 1200 + idx * 37;
    });
    setLikeCountMap(initial);
    setActiveId(reels[0]?.id || "");
    setActiveIndex(0);
    setLoopIndex(reels.length ? 1 : 0);
  }, [reels]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  const showControlsTemporarily = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 1200);
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems?.length > 0 && viewableItems[0].item?.id) {
        const loopIdx = viewableItems[0].index ?? 0;
        setLoopIndex(loopIdx);
        const mirrorId = viewableItems[0].item?.mirrorId ?? viewableItems[0].item?.id;
        if (loopIdx === 0) {
          setActiveIndex(reels.length - 1);
          setActiveId(reels[reels.length - 1]?.id || mirrorId);
        } else if (loopIdx === loopedData.length - 1) {
          setActiveIndex(0);
          setActiveId(reels[0]?.id || mirrorId);
        } else {
          setActiveIndex(loopIdx - 1);
          setActiveId(mirrorId);
        }
        setIsPaused(false);
        setControlsVisible(false);
      }
    }
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const handleMomentumEnd = () => {
    if (!reels.length) return;
    if (loopIndex === 0) {
      listRef.current?.scrollToIndex({ index: reels.length, animated: false });
    } else if (loopIndex === loopedData.length - 1) {
      listRef.current?.scrollToIndex({ index: 1, animated: false });
    }
  };

  const renderItem = ({ item, index }: { item: ReelItem; index: number }) => {
    const isActiveVisible = index === loopIndex;
    return (
      <View style={[styles.card, { height: CARD_HEIGHT }]}>
        <Video
          source={item.source}
          style={styles.cardVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay={
            isActiveVisible && activeId === (item.mirrorId || item.id) && !isPaused
          }
          isLooping
          isMuted={false}
          useNativeControls={false}
        />
        <View style={styles.cardContent}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cartBadge}
            onPress={async () => {
              const normalize = (val: string) =>
                (val || "").toLowerCase().replace(/\s+/g, " ").trim();
              const categoryLabel = item.title || item.description || "Produk";
              const categoryKey = normalize(categoryLabel);
              setBadgeModalVisible(true);
              setModalLoading(true);
              setModalError(null);
              setModalCategory(categoryLabel);
              try {
                const tryFetchProducts = async () => {
                  const res = await fetchProducts(
                    DEFAULT_STORE_ID,
                    0,
                    userToken || "",
                    new Set<number>()
                  );
                  return Array.isArray(res) ? res : [];
                };

                const fallbackFetch = async () => {
                  const res = await fetch(
                    `https://api.laskarbuah.com/api/produk?v_where=''&v_page=0&v_row=0&id_store=${DEFAULT_STORE_ID}`
                  );
                  const json = await res.json();
                  return Array.isArray(json) ? json : [];
                };

                let list: any[] = [];
                try {
                  list = await tryFetchProducts();
                } catch (e) {
                  // fallback without token
                  list = await fallbackFetch();
                }

                if (!list.length) {
                  list = await fallbackFetch();
                }

                if (!list.length) {
                  setModalError("Produk tidak ditemukan");
                }

                const scoreProduct = (p: any) => {
                  const cat = normalize(p.cate || p.kategory || p.description);
                  const name = normalize(p.name_produk || p.title);
                  let score = 0;
                  if (categoryKey && name.includes(categoryKey)) score += 3;
                  if (categoryKey && categoryKey.includes(name) && name) score += 2;
                  if (categoryKey && cat.includes(categoryKey)) score += 2;
                  if (categoryKey && categoryKey.includes(cat) && cat) score += 1;
                  return score;
                };

                const scored = list
                  .map((p) => ({ ...p, _score: scoreProduct(p) }))
                  .filter((p) => p._score > 0)
                  .sort((a, b) => b._score - a._score);

                const finalList =
                  scored.length > 0 ? scored.slice(0, 12) : list.slice(0, 12);

                setModalItems(finalList);
              } catch (err) {
                setModalError("Gagal memuat produk");
                setModalItems([item]);
              } finally {
                setModalLoading(false);
              }
            }}
          >
            <View style={styles.cartIconWrap}>
              <Ionicons name="bag-handle" size={14} color="#fff" />
            </View>
            <Text style={styles.cartBadgeText} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.pauseOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsPaused((prev) => !prev);
            showControlsTemporarily();
          }}
        >
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={48}
            color="rgba(255,255,255,0.35)"
            style={{ opacity: controlsVisible ? 1 : 0 }}
          />
        </TouchableOpacity>
        <View style={styles.actionColumn}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Animated.Image
                source={require("../../assets/images/update_logolbi.png")}
                style={styles.avatar}
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const current = likedMap[item.id] ?? false;
              setLikedMap((prev) => ({ ...prev, [item.id]: !current }));
              setLikeCountMap((prev) => {
                const base = prev[item.id] ?? 1200 + index * 37;
                return { ...prev, [item.id]: current ? Math.max(0, base - 1) : base + 1 };
              });
            }}
          >
            <Ionicons
              name={likedMap[item.id] ? "heart" : "heart-outline"}
              size={26}
              color={likedMap[item.id] ? "#ff4d6d" : "#fff"}
            />
            <Text style={styles.actionCount}>
              {formatCount(likeCountMap[item.id] ?? 1200 + index * 37)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#000000", "#000000", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.floatingHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              router.replace("/");
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LBI Reels</Text>
        </View>
        <FlatList
          ref={listRef}
          data={loopedData}
          keyExtractor={(item) => item.loopKey || item.id}
          renderItem={renderItem}
          initialScrollIndex={loopedData.length > 1 ? 1 : 0}
          pagingEnabled
          snapToInterval={CARD_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          bounces={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? "Memuat video..." : error ? error : "Tidak ada video tersedia"}
              </Text>
            </View>
          }
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onMomentumScrollEnd={handleMomentumEnd}
          getItemLayout={(_, index) => ({
            length: CARD_HEIGHT,
            offset: CARD_HEIGHT * index,
            index,
          })}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.listContent}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={2}
          removeClippedSubviews
        />
        <Modal
          transparent
          visible={isBadgeModalVisible}
          animationType="fade"
          onRequestClose={() => setBadgeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="bag-handle" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Produk kategori</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {modalCategory || "Tidak ada kategori"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setBadgeModalVisible(false)}
                  style={styles.modalClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color="#0b1427" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ maxHeight: 320, width: "100%" }}
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={false}
              >
                {isModalLoading ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="small" color="#115f9f" />
                    <Text style={styles.modalLoadingText}>Memuat produk...</Text>
                  </View>
                ) : modalItems.length > 0 ? (
                  modalItems.map((prod) => (
                    <View key={prod.id || prod.title} style={styles.modalItem}>
                      <View style={styles.modalItemIcon}>
                        <Ionicons name="pricetag" size={16} color="#0b1427" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalItemTitle} numberOfLines={1}>
                          {prod.title || prod.name_produk || "Produk"}
                        </Text>
                        <Text style={styles.modalItemSubtitle} numberOfLines={1}>
                          {prod.description || prod.cate || prod.name_store || modalCategory}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.modalLoadingText}>Produk tidak ditemukan</Text>
                )}
              </ScrollView>
              {modalError ? (
                <Text style={styles.modalErrorText}>{modalError}</Text>
              ) : null}
            </View>
          </View>
        </Modal>
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]}
          locations={[0, 1]}
          style={styles.bottomGradient}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  floatingHeader: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    paddingTop: 0,
    paddingHorizontal: 16,
    height: 80,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    zIndex: 20,
  },
  headerTitle: {
    color: "#fff",
    top: -40,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    alignSelf: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  card: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
  },
  cardVideo: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: "absolute",
    bottom: 100,
    left: 10,
    right: 0,
    paddingHorizontal: 18,
    paddingVertical: 12,
    zIndex: 3,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  desc: {
    color: "#e8f5ff",
    fontSize: 14,
    marginBottom: 10,
  },
  cartBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 174, 255, 1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    gap: 6,
  },
  cartIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#ffffffff",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "82%",
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  actionColumn: {
    position: "absolute",
    right: 20,
    bottom: 120,
    alignItems: "center",
    gap: 20,
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modalCard: {
    backgroundColor: "#f8fbff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  modalHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d5deeb",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  modalHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#115f9f",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0b1427",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#4a6078",
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(11,20,39,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalList: {
    paddingTop: 6,
    paddingBottom: 6,
    gap: 10,
  },
  modalLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  modalLoadingText: {
    fontSize: 13,
    color: "#4a6078",
  },
  modalErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#d7263d",
    textAlign: "left",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#0b2850",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  modalItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(17,95,159,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0b1427",
  },
  modalItemSubtitle: {
    fontSize: 12,
    color: "#4a6078",
    marginTop: 2,
  },
  avatarWrap: {
    marginBottom: 4,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#fff",
    resizeMode: "cover",
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
  },
});

function formatCount(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}rb`;
  return `${val}`;
}
