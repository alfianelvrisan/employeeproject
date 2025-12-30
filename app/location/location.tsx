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
  ImageBackground,
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
  locationInstance?: ReturnType<typeof useLocationData>;
};

const LOCATION_ICON = {
  uri: "https://laskarbuah-sales.s3.ap-southeast-3.amazonaws.com/foto_produk/4cdf88f8-319b-4e52-a65d-b9e7d96f323a.png",
};

export default function LocationComponent({
  onSelectStore,
  displayMode = "all",
  style,
  locationInstance,
}: LocationComponentProps) {
  const { userToken } = useAuth();

  // Use provided instance or create new one
  const internalInstance = useLocationData(onSelectStore, userToken || "");
  const {
    location,
    loading,
    apidata,
    selectedStore,
    setSelectedStore,
    coords,
    updateLocationByCoords,
    initialCoords,
  } = locationInstance || internalInstance;

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
          <View style={styles.locationRow}>
            <Image
              source={require("../../assets/images/locationbar.png")}
              style={{ width: 160, height: 28, marginBottom: -2 }}
              resizeMode="contain"
            />
            <View style={styles.locationIconWrapper}>
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
            </View>
            <Text
              style={[styles.locations, isPlain && styles.locationsPlain]}
              numberOfLines={2}
            >
              {location || "Lokasi tidak ditemukan"}
            </Text>
          </View>
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
      {displayMode !== "store" && (
        <View
          style={[
            styles.plainLocationWrap,
            displayMode !== "all" && cardSizeStyle,
            displayMode === "all" && styles.locationPlainRow,
          ]}
        >
          {renderLocationContent(true)}
        </View>
      )}

      {displayMode !== "location" && (
        <ImageBackground
          source={require("../../assets/images/bgpilihtoko.png")}
          style={[styles.cardPicker, cardSizeStyle]}
          imageStyle={styles.cardPickerImage}
          resizeMode="cover"
        >
          <View style={styles.cardPickerOverlay}>
            <View style={styles.iconLabel}>
              <Image
                source={require("../../assets/images/storechoose.png")}
                style={styles.headerImage}
                resizeMode="contain"
              />
              <Text style={styles.label}>Store</Text>
            </View>
            <View style={styles.selectorContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.storeSelector}
                onPress={() => setShowStoreModal(true)}
              >
                <View style={styles.selectorTextWrap}>
                  <Text style={styles.selectorValue}>
                    {(() => {
                      const store = apidata.find((s: any) => String(s.id) === selectedStore);
                      return store?.name_store || store?.nama_store || "Pilih toko";
                    })()}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#de0866" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
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
                  <Ionicons name="close" size={20} color="#de0866" />
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
                      <Ionicons name="checkmark-circle" size={20} color="#000000ff" />
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
                  <Ionicons name="close" size={20} color="#de0866" />
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
                <Ionicons name="locate" size={16} color="#ffffffff" />
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
    gap: 10,
  },
  containerSingle: {
    flexDirection: "column",
    width: "100%",
    marginHorizontal: 0,
    gap: 12,
  },
  cardFullWidth: {
    width: "100%",
    marginHorizontal: 0,
  },
  cardPicker: {
    width: "49%",
    height: 140, // Fixed height to match Cardhome
    borderRadius: 16, // Match Cardhome
    borderWidth: 0, // Removed border for cleaner look, similar to Cardhome
    backgroundColor: "#fff", // Fallback
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 8, // Add vertical spacing similar to Cardhome
  },
  cardPickerOverlay: {
    flex: 1,
    padding: 16, // Increased padding for better spacing
    borderRadius: 16,
    justifyContent: "space-between",
  },
  cardPickerImage: {
    borderRadius: 16,
  },
  locationDisplay: {
    backgroundColor: "#fffef8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 195, 0, 0.3)",
    shadowColor: "rgba(244, 194, 0, 0.35)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  locationRow: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: 1,
  },
  locationIconWrapper: {
    alignItems: "flex-end",
    width: "100%",
    paddingRight: 4,
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
    width: 40,
    height: 40,
  },
  locations: {
    color: "#6b4b00",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    paddingRight: 4,
  },
  locationHint: {
    fontSize: 11,
    color: "#ffffffff",
    marginTop: 6,
    marginLeft: 2,
  },
  plainLocationWrap: {
    width: "100%",
    marginTop: 0,
  },
  locationPlainRow: {
    width: "49%",
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

  // Text Location
  locationsPlain: {
    color: "#000000ff",
    fontWeight: "700",
  },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerImage: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10, // Adjusted vertical padding
    // Removed border for cleaner look inside the card
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  selectorLabel: {
    fontSize: 11,
    color: "#000000ff",
    display: "none", // hidden as it is replaced by image
  },
  selectorContainer: {
    width: "100%",
  },
  selectorLabelImage: {
    display: "none",
  },
  selectorValue: {
    fontSize: 15,
    color: "#000000ff",
    fontWeight: "700",
    textAlign: "left",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#000000ee",
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
    backgroundColor: "#ffffffff",
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#de0866",
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
    color: "#000000ff",
    fontWeight: "600",
    marginRight: 8,
  },
  modalItemDistance: {
    fontSize: 12,
    color: "#6e6e6eff",
  },
  mapBackdrop: {
    flex: 1,
    backgroundColor: "#000000ee",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  mapCard: {
    backgroundColor: "#ffffffff", // Turunan sangat muda dari #fff247
    borderRadius: 20,
    width: "100%",
    maxWidth: "100%",
    height: 700,
    padding: 16,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: "hidden",
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
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
    backgroundColor: "#de0866",
  },
  mapMyLocationText: {
    color: "#ffffffff",
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
    backgroundColor: "#fffde7",
    borderWidth: 1,
    borderColor: "#fff247",
  },
  mapButtonPrimary: {
    backgroundColor: "#fff247",
  },
  mapButtonDisabled: {
    opacity: 0.6,
  },
  mapButtonText: {
    fontWeight: "700",
    color: "#000000ff",
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
