import { Text, View, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
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
        <View style={styles.card2}>
          {loading ? (
            <View style={styles.loadingCard}>
              <View style={styles.loadingIcon} />
              <View style={styles.loadingText} />
            </View>
          ) : (
            <>
              <View style={styles.iconLabel2}>
                <Ionicons name="location" size={16} color="#0f4d92" />
                <Text style={styles.label}>Your Location</Text>
              </View>
              <Text style={styles.locations}>
                {location || "Lokasi tidak ditemukan"}
              </Text>
            </>
          )}
        </View>

        <View style={styles.cardPicker}>
          <View style={styles.iconLabel}>
            <Ionicons name="home" size={16} color="#0f4d92" />
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
            <Ionicons name="chevron-down" size={18} color="#0f4d92" />
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
                    <Ionicons name="close" size={20} color="#0f4d92" />
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
                        <Ionicons name="checkmark-circle" size={20} color="#0f4d92" />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.divider} />}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </Modal>
        </View>
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
    backgroundColor: "#e9f1ff",
    borderWidth: 1,
    borderColor: "rgba(17, 95, 159, 0.08)",
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardPicker: {
    backgroundColor: "#e9f1ff",
    width: "49%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(17, 95, 159, 0.08)",
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  locations: {
    color: "#0f4d92",
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
    color: "#0f4d92",
    fontSize: 14,
    fontWeight: "700",
  },
  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4f8ff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(17, 95, 159, 0.12)",
  },
  selectorTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  selectorLabel: {
    fontSize: 11,
    color: "#4a6078",
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 14,
    color: "#0f4d92",
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
    backgroundColor: "#f8fbff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(17, 95, 159, 0.12)",
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
    color: "#0f4d92",
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
    color: "#0f4d92",
    fontWeight: "600",
    marginRight: 8,
  },
  modalItemDistance: {
    fontSize: 12,
    color: "#6b7a90",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(17, 95, 159, 0.1)",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    marginRight: 10,
  },
  loadingText: {
    width: "70%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
  },
});
