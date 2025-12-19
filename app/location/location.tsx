import { Text, View, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import useLocationData from "../../services/useLocationData";

export default function LocationComponent({ onSelectStore }: any) {
  const { userToken } = useAuth();
  const {
    location,
    loading,
    apidata,
    selectedStore,
    setSelectedStore,
  } = useLocationData(onSelectStore, userToken || "");
  const [showStoreModal, setShowStoreModal] = React.useState(false);

  const handleSelectStore = (value: string) => {
    setSelectedStore(value);
    setShowStoreModal(false);
  };

  return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#fff7d1", "#fffdf5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card2}
        >
          {loading ? (
            <View style={styles.loadingCard}>
              <View style={styles.loadingIcon} />
              <View style={styles.loadingText} />
            </View>
          ) : (
            <>
              <View style={styles.iconLabel2}>
                <Ionicons name="location" size={16} color="#7a4b00" />
                <Text style={styles.label}>Your Location</Text>
              </View>
              <Text style={styles.locations}>
                {location || "Lokasi tidak ditemukan"}
              </Text>
            </>
          )}
        </LinearGradient>

        <LinearGradient
          colors={["#fff7d1", "#fffdf5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardPicker}
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
        </LinearGradient>
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
  locations: {
    color: "#6b4b00",
    fontSize: 14,
    opacity: 0.9,
    marginTop: 14,
    marginLeft: 2,
  },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconLabel2: {
    flexDirection: "row",
    alignItems: "center",
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
