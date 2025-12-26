import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleProp,
  ViewStyle,
  Image,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import { useAuth } from "../../context/AuthContext";
import useLocationData from "../../services/useLocationData";

type Coordinates = {
  latitude: number;
  longitude: number;
};

const DEFAULT_REGION: Region = {
  latitude: -6.1754,
  longitude: 106.8272,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type LocationComponentProps = {
  onSelectStore: (value: string) => void;
  displayMode?: "all" | "location" | "store";
  style?: StyleProp<ViewStyle>;
};

const LOCATION_ICON = {
  uri: "https://laskarbuah-sales.s3.ap-southeast-3.amazonaws.com/foto_produk/4cdf88f8-319b-4e52-a65d-b9e7d96f323a.png",
};

export default function LocationComponent({
  onSelectStore,
  displayMode = "all",
  style,
}: LocationComponentProps) {
  const { userToken } = useAuth();
  const {
    location,
    loading,
    apidata,
    selectedStore,
    setSelectedStore,
    coords,
    updateLocationByCoords,
    initialCoords,
  } = useLocationData(onSelectStore, userToken || "");
  const [showStoreModal, setShowStoreModal] = React.useState(false);
  const [showMapModal, setShowMapModal] = React.useState(false);
  const [pickerCoords, setPickerCoords] = React.useState<Coordinates | null>(null);
  const [savingManualLocation, setSavingManualLocation] = React.useState(false);
  const effectiveRegion = React.useMemo<Region>(() => {
    const target = pickerCoords ?? coords;
    if (target) {
      return {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_REGION;
  }, [coords, pickerCoords]);

  const handleSelectStore = (value: string) => {
    setSelectedStore(value);
    setShowStoreModal(false);
  };

  const handleOpenMapModal = () => {
    setPickerCoords(coords);
    setShowMapModal(true);
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPickerCoords({ latitude, longitude });
  };

  const handleConfirmMap = async () => {
    if (!pickerCoords) {
      return;
    }
    try {
      setSavingManualLocation(true);
      await updateLocationByCoords(pickerCoords);
      setShowMapModal(false);
    } finally {
      setSavingManualLocation(false);
    }
  };

  const handleBackToMyLocation = async () => {
    if (!initialCoords) {
      return;
    }
    try {
      setSavingManualLocation(true);
      setPickerCoords(initialCoords);
      await updateLocationByCoords(initialCoords);
      setShowMapModal(false);
    } finally {
      setSavingManualLocation(false);
    }
  };

  const containerStyle = React.useMemo(
    () => [
      styles.container,
      displayMode !== "all" && styles.containerSingle,
      style,
    ],
    [displayMode, style]
  );
  const cardSizeStyle =
    displayMode !== "all" ? styles.cardFullWidth : undefined;

  const renderLocationContent = (isPlain: boolean) => {
    return loading ? (
      <View style={styles.loadingCard}>
        <View style={styles.loadingIcon} />
        <View style={styles.loadingText} />
      </View>
    ) : (
      <>
        <TouchableOpacity
          style={[
            styles.locationDisplay,
            isPlain && styles.locationDisplayPlain,
          ]}
          onPress={handleOpenMapModal}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.locationIconWrap,
              isPlain && styles.locationIconPlain,
            ]}
          >
            <Image
              source={LOCATION_ICON}
              style={[
                styles.locationIconImage,
                isPlain && styles.locationIconImagePlain,
              ]}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[styles.locations, isPlain && styles.locationsPlain]}
            numberOfLines={2}
          >
            {location || "Lokasi tidak ditemukan"}
          </Text>
        </TouchableOpacity>
        {!isPlain && (
          <Text style={styles.locationHint}>
            Ketuk teks lokasi untuk pilih via maps
          </Text>
        )}
      </>
    );
  };

  return (
    <View style={containerStyle}>
      {displayMode !== "store" &&
        (displayMode === "location" ? (
          <View style={[styles.plainLocationWrap, cardSizeStyle]}>
            {renderLocationContent(true)}
          </View>
        ) : (
          <LinearGradient
            colors={["#fff7d1", "#fffdf5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card2, cardSizeStyle]}
          >
            {renderLocationContent(false)}
          </LinearGradient>
        ))}

      {displayMode !== "location" && (
        <LinearGradient
          colors={["#fff7d1", "#fffdf5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardPicker, cardSizeStyle]}
        >
          <View style={styles.iconLabel}>
            <Ionicons name="home" size={16} color="#7a4b00" />
            <Text style={styles.label}>Choose Store</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.storeSelector}
            onPress={() => setShowStoreModal(true)}
          >
            <View style={styles.selectorTextWrap}>
              <Text style={styles.selectorLabel}>Toko terpilih</Text>
              <Text style={styles.selectorValue} numberOfLines={1}>
                {apidata.find((s: any) => String(s.id) === selectedStore)?.name_store ||
                  "Pilih toko"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#7a4b00" />
          </TouchableOpacity>
        </LinearGradient>
      )}

        {displayMode !== "location" && (
          <Modal
            transparent
            visible={showStoreModal}
            animationType="fade"
            onRequestClose={() => setShowStoreModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.backdropTouchable}
                activeOpacity={1}
                onPress={() => setShowStoreModal(false)}
              />
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pilih Store</Text>
                  <TouchableOpacity onPress={() => setShowStoreModal(false)}>
                    <Ionicons name="close" size={20} color="#7a4b00" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={apidata}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => handleSelectStore(String(item.id))}
                    >
                      <View style={styles.modalItemText}>
                        <Text style={styles.modalItemName}>{item.name_store}</Text>
                        <Text style={styles.modalItemDistance}>{item.distance} km</Text>
                      </View>
                      {String(item.id) === selectedStore && (
                        <Ionicons name="checkmark-circle" size={20} color="#f4c200" />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.divider} />}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </Modal>
        )}

      {displayMode !== "store" && (
        <Modal
          transparent
          visible={showMapModal}
          animationType="fade"
          onRequestClose={() => setShowMapModal(false)}
        >
          <View style={styles.mapBackdrop}>
            <TouchableOpacity
              style={styles.backdropTouchable}
              activeOpacity={1}
              onPress={() => setShowMapModal(false)}
            />
            <View style={styles.mapCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Lokasi di Map</Text>
                <TouchableOpacity onPress={() => setShowMapModal(false)}>
                  <Ionicons name="close" size={20} color="#ffffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={effectiveRegion}
                  onPress={handleMapPress}
                >
                  {pickerCoords && <Marker coordinate={pickerCoords} />}
                </MapView>
              </View>
              <View style={styles.mapHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color="#7a4b00"
                />
                <Text style={styles.mapHintText}>
                  Ketuk titik pada peta untuk memilih lokasi pengirimanmu.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.mapMyLocationButton}
                onPress={handleBackToMyLocation}
                disabled={!initialCoords || savingManualLocation}
              >
                <Ionicons name="locate" size={16} color="#7a4b00" />
                <Text style={styles.mapMyLocationText}>Kembali ke lokasi saya</Text>
              </TouchableOpacity>
              <View style={styles.mapActions}>
                <TouchableOpacity
                  style={[styles.mapButton, styles.mapButtonSecondary]}
                  onPress={() => setShowMapModal(false)}
                  disabled={savingManualLocation}
                >
                  <Text style={styles.mapButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.mapButton,
                    styles.mapButtonPrimary,
                    !pickerCoords && styles.mapButtonDisabled,
                  ]}
                  onPress={handleConfirmMap}
                  disabled={!pickerCoords || savingManualLocation}
                >
                  <Text style={styles.mapButtonText}>
                    {savingManualLocation ? "Menyimpan..." : "Gunakan Lokasi"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: "2%",
    marginTop: 8,
  },
  containerSingle: {
    flexDirection: "column",
    width: "100%",
    marginHorizontal: 0,
    gap: 12,
  },
  card2: {
    width: "49%",
    borderRadius: 14,
    padding: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.35)",
    backgroundColor: "transparent",
    shadowColor: "rgba(244, 194, 0, 0.6)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardFullWidth: {
    width: "100%",
    marginHorizontal: 0,
  },
  cardPicker: {
    width: "49%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.35)",
    backgroundColor: "transparent",
    shadowColor: "rgba(244, 194, 0, 0.6)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#fffef8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.3)",
    marginTop: 12,
    gap: 10,
    shadowColor: "rgba(244, 194, 0, 0.35)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff3c4",
    marginRight: 10,
  },
  locationIconImage: {
    width: 26,
    height: 26,
  },
  locationIconImagePlain: {
    width: 30,
    height: 30,
  },
  locations: {
    flex: 1,
    color: "#6b4b00",
    fontSize: 14,
    fontWeight: "700",
  },
  locationHint: {
    fontSize: 11,
    color: "#8c6c20",
    marginTop: 6,
    marginLeft: 2,
  },
  plainLocationWrap: {
    width: "100%",
    marginTop: 8,
  },
  locationDisplayPlain: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
    gap: 12,
  },
  locationIconPlain: {
    backgroundColor: "transparent",
    marginRight: 12,
  },
  locationsPlain: {
    color: "#6b4b00",
    fontWeight: "700",
  },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    marginLeft: 5,
    color: "#6b4b00",
    fontSize: 14,
    fontWeight: "700",
  },
  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fffef8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.45)",
    shadowColor: "rgba(244, 194, 0, 0.35)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 2,
  },
  selectorTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  selectorLabel: {
    fontSize: 11,
    color: "#8c6c20",
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 14,
    color: "#573800",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 12, 31, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#fffdf5",
    borderRadius: 16,
    padding: 16,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.45)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b4b00",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  modalItemText: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalItemName: {
    fontSize: 14,
    color: "#6b4b00",
    fontWeight: "600",
    marginRight: 8,
  },
  modalItemDistance: {
    fontSize: 12,
    color: "#a28032",
  },
  mapBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  mapCard: {
    backgroundColor: "#fffdf5",
    borderRadius: 20,
    width: "95%",
    maxWidth: 420,
    maxHeight: "90%",
    padding: 16,
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 16,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.45)",
  },
  map: {
    width: "100%",
    height: 260,
  },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  mapHintText: {
    fontSize: 12,
    color: "#7a4b00",
    flex: 1,
  },
  mapMyLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,195,0,0.4)",
    backgroundColor: "#fff9e0",
  },
  mapMyLocationText: {
    color: "#6b4b00",
    fontSize: 13,
    fontWeight: "700",
  },
  mapActions: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  mapButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  mapButtonSecondary: {
    backgroundColor: "#fff2cc",
    borderWidth: 1,
    borderColor: "rgba(255,195,0,0.45)",
  },
  mapButtonPrimary: {
    backgroundColor: "#f4c200",
  },
  mapButtonDisabled: {
    opacity: 0.6,
  },
  mapButtonText: {
    fontWeight: "700",
    color: "#4b3400",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 195, 0, 0.25)",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f4e2a0",
    marginRight: 10,
  },
  loadingText: {
    width: "70%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f4e2a0",
  },
});
