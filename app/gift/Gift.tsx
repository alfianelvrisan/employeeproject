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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useNavigation, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import Ionicons from "@expo/vector-icons/Ionicons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_HEIGHT = SCREEN_HEIGHT;

type ReelBase = {
  id: string;
  title: string;
  description: string;
  source: any;
};

type ReelItem = ReelBase & { loopKey?: string; mirrorId?: string };

const reels: ReelBase[] = [
  {
    id: "1",
    title: "LBI Reels 1",
    description: "Geser untuk melihat video lainnya.",
    source: require("../../assets/images/reels/vidio1.mp4"),
  },
  {
    id: "2",
    title: "LBI Reels 2",
    description: "Video kedua dari Laskar Buah.",
    source: require("../../assets/images/reels/vidio2.mp4"),
  },
  {
    id: "3",
    title: "LBI Reels 3",
    description: "Video ketiga dari Laskar Buah.",
    source: require("../../assets/images/reels/vidio3.mp4"),
  },
];

export default function GiftReels() {
  const navigation = useNavigation<any>();
  const router = useRouter();
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string>(reels[0]?.id || "");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loopIndex, setLoopIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
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
  }, []);

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
    const initial: Record<string, number> = {};
    reels.forEach((item, idx) => {
      initial[item.id] = 1200 + idx * 37;
    });
    setLikeCountMap(initial);
  }, []);

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
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.6)"]}
          style={styles.overlay}
        />
        <View style={styles.cardContent}>
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
          initialScrollIndex={1}
          pagingEnabled
          snapToInterval={CARD_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          bounces={false}
        showsVerticalScrollIndicator={false}
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
        <View style={styles.bottomPanel} />
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
    top:-40,
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
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    bottom: 50,
    left: 5,
    right: 0,
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  desc: {
    color: "#e8f5ff",
    fontSize: 14,
    marginBottom: 14,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  actionColumn: {
    position: "absolute",
    right: 20,
    bottom: 120,
    alignItems: "center",
    gap: 20,
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
});

function formatCount(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}rb`;
  return `${val}`;
}
