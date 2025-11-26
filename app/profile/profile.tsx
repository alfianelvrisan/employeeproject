import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  View,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ProgressBarAndroid,
  Animated,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Link, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Brightness from "expo-brightness";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile } from "../../services/profileServices";
import { LinearGradient } from "expo-linear-gradient";
import useScrollHeader from "../../hooks/useScrollHeader";

const goldmember = require("../../assets/images/silver.png");
const gold2 = require("../../assets/images/gold2.png");
const goldlogo = require("../../assets/images/silverlogo.png");
const goldlogo2 = require("../../assets/images/goldslogo.png");
const premiumlogo = require("../../assets/images/premiumlogo.png");
const diamond = require("../../assets/images/diamond.png");

export default function Profile() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const { headerStyle, handleScroll } = useScrollHeader();

  const [isModalVisible, setModalVisible] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(
    null
  );
  const { logout } = useAuth();
  const { userToken } = useAuth();
  const [rank, setRank] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const currentTransaction = target;
  const targetTransaction = current;

  const [profil, setProfile] = React.useState<{
    member_card: number;
    no_tlp: string;
    rankd: string;
  } | null>(null);
  const levelTheme = React.useMemo(() => {
    switch ((rank || "").toLowerCase()) {
      case "bronze":
        return { bg: "#f8e3c0", text: "#b87429" };
      case "premium":
        return { bg: "#fff4cf", text: "#c18a00" };
      case "platinum":
        return { bg: "#e7edf5", text: "#4a6078" };
      default:
        return { bg: "#e6f3ff", text: "#115f9f" };
    }
  }, [rank]);

  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  useEffect(() => {
    if (userToken) {
      fetchProfile(userToken)
        .then((profile) => {
          setProfile(profile);
          setBarcodeValue(profile.member_card.toString());
          setRank(profile.rankd);
          setTarget(profile.pencapaian);
          setCurrent(profile.target);
        })
        .catch((error) => console.warn(error.message));
    }
  }, [userToken]);

  const toggleModal = async () => {
    if (!isModalVisible) {
      const currentBrightness = await Brightness.getBrightnessAsync();
      console.log("Original Brightness:", currentBrightness);
      setOriginalBrightness(currentBrightness);

      await Brightness.setBrightnessAsync(1);
    } else {
      if (originalBrightness !== null) {
        console.log("Restoring Brightness:", originalBrightness);
        await Brightness.setBrightnessAsync(originalBrightness);
      }
    }

    setModalVisible(!isModalVisible);
  };

  const closeModal = async () => {
    if (originalBrightness !== null) {
      console.log("Restoring Brightness on Close:", originalBrightness);
      await Brightness.setBrightnessAsync(originalBrightness);
    }
    setModalVisible(false);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <LinearGradient
          colors={["#cde7ff", "#e6f3ff", "#ffffff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.4 }}
          style={styles.gradientBg}
        >
        <SafeAreaView style={[styles.container]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.infoCard}>
              <View>
                <Text style={styles.profileName}>
                  {profil?.nama || "Member LBI"}
                </Text>
                <Text style={styles.profilePhone}>
                  {profil?.no_tlp ? `${profil.no_tlp}` : "Nomor belum ada"}
                </Text>
                <Text style={styles.profileId}>
                  {profil?.member_card ? `ID: ${profil.member_card}` : ""}
                </Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelLabel}>Level</Text>
                <Text
                  style={[
                    styles.levelText,
                    { color: levelTheme.text },
                  ]}
                >
                  {rank || "Member"}
                </Text>
              </View>
            </View>
            <View style={styles.goldRow}>
              <View style={styles.goldContainer}>
                <Image
                  source={
                    rank === "bronze"
                      ? goldmember
                      : rank === "premium"
                      ? gold2
                      : rank === "platinum"
                      ? diamond
                      : goldmember
                  }
                  style={styles.cardmember}
                />
                <Animated.Image
                  source={
                    rank === "bronze"
                      ? goldlogo
                      : rank === "premium"
                      ? goldlogo2
                      : rank === "premium"
                      ? premiumlogo
                      : goldlogo
                  }
                  style={[
                    styles.goldlogo,
                    {
                      transform: [{ scale: scaleAnim }],
                      opacity: opacityAnim,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={styles.barcodeButton}
                onPress={toggleModal}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={22}
                  color="#115f9f"
                  style={{ marginBottom: 6 }}
                />
                <Text style={styles.barcodeText}>Barcode</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.menuContainer}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="medal" style={styles.titleprofile1} />
                <Text style={{ fontWeight: "bold" }}>Achivement</Text>
              </View>
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuContent}>
                  <Ionicons name="trending-up" size={18} style={styles.icon} />
                  <Text style={styles.textprogess}>
                    {target} / {current}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <ProgressBarAndroid
                      styleAttr="Horizontal"
                      indeterminate={false}
                      progress={
                        currentTransaction && targetTransaction
                          ? currentTransaction / targetTransaction
                          : 0
                      }
                      color="#115f9f"
                      style={styles.progressBar}
                    />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleModal}>
                <View style={styles.menuContent}>
                  <Ionicons
                    name="qr-code-outline"
                    size={18}
                    style={styles.icon}
                  />
                  <Text style={styles.menuText}>Barcode Member</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} style={styles.arrow} />
              </TouchableOpacity>
              <Text style={styles.titleprofile}>Akun</Text>
              <Link href="/profile/subProfil/profil" asChild>
                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuContent}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      style={styles.icon}
                    />
                    <Text style={styles.menuText}>Profile</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} style={styles.arrow} />
                </TouchableOpacity>
              </Link>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/profile/subProfil/Notifikasi")}
              >
                <View style={styles.menuContent}>
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    style={styles.icon}
                  />
                  <Text style={styles.menuText}>Notifikasi</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} style={styles.arrow} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  router.push({
                    pathname: "/profile/subProfil/changePin",
                    params: {
                      whatsapp: profil?.no_tlp,
                    },
                  })
                }
              >
                <View style={styles.menuContent}>
                  <Ionicons name="key-outline" size={18} style={styles.icon} />
                  <Text style={styles.menuText}>Change Pin</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} style={styles.arrow} />
              </TouchableOpacity>
              <Text style={styles.titleprofile}>Bantuan</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  router.push("/profile/subProfil/SyaratKetentuan")
                }
              >
                <View style={styles.menuContent}>
                  <Ionicons
                    name="document-attach-outline"
                    size={18}
                    style={styles.icon}
                  />
                  <Text style={styles.menuText}>Syarat Ketentuan</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} style={styles.arrow} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                // onPress={() => router.push("/scan/ScanKTP")}
                onPress={() => router.push("/profile/subProfil/PusatBantuan")}
              >
                <View style={styles.menuContent}>
                  <Ionicons
                    name="headset-outline"
                    size={18}
                    style={styles.icon}
                  />
                  <Text style={styles.menuText}>Pusat Bantuan</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} style={styles.arrow} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, { marginTop: 20 }]}
                onPress={handleLogout}
              >
                <View style={styles.menuContent}>
                  <Ionicons name="log-out" size={18} style={styles.icon2} />
                  <Text style={styles.menuText2}>Keluar</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} style={styles.arrow} />
              </TouchableOpacity>
            </View>
          </ScrollView>
          {/* modal */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={closeModal}
          >
            <TouchableWithoutFeedback onPress={closeModal}>
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      *Silahkan Scan Di kasir agar mempermudah transaksi
                    </Text>
                    {/* Barcode Dinamis */}
                    <View style={styles.barcodeContainer}>
                      <QRCode value={barcodeValue} size={230} />
                    </View>

                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closeModal}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          {/* Logout Confirmation Modal */}
          <Modal
            visible={isLogoutModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setLogoutModalVisible(false)}
          >
            <View style={styles.logoutModalOverlay}>
              <View style={styles.logoutModalContent}>
                <Text style={styles.logoutModalTitle}>Konfirmasi Logout</Text>
                <Text style={styles.logoutModalMessage}>
                  Apakah Anda yakin ingin logout?
                </Text>
                <View style={styles.logoutModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setLogoutModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmLogout}
                  >
                    <Text style={styles.confirmButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
        </LinearGradient>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: "transparent",
    paddingBottom: 32,
  },
  gradientBg: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f4d92",
  },
  profilePhone: {
    fontSize: 13,
    color: "#4a6078",
    marginTop: 4,
  },
  profileId: {
    fontSize: 12,
    color: "#7c8ca4",
    marginTop: 2,
  },
  menuContainer: {
    marginTop: 16,
    width: "92%",
    marginHorizontal: "4%",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(17, 95, 159, 0.08)",
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
    color: "#115f9f",
  },
  icon2: {
    marginRight: 10,
    color: "red",
  },
  icon3: {
    marginRight: 2,
    color: "red",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
  menuText2: {
    fontSize: 16,
    color: "red",
  },
  arrow: {
    color: "#ccc",
  },
  cardmember: {
    width: "88%",
    height: 120,
    borderRadius: 14,
    marginHorizontal: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    height: "43%",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "light",
    top: 30,
    alignSelf: "flex-start",
    fontStyle: "italic",
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  barcodeContainer: {
    marginBottom: 20,
    marginVertical: "auto",
  },
  closeButton: {
    backgroundColor: "#115f9f",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    position: "absolute",
    alignSelf: "flex-end",
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButtonicon: {
    position: "absolute",
    alignContent: "flex-end",
  },
  textprogess: {
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  goldContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: "92%",
    alignSelf: "center",
    marginTop: 8,
  },
  goldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "92%",
    alignSelf: "center",
    gap: 12,
  },
  goldlogo: {
    position: "absolute",
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  barcodeButton: {
    width: 64,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(17,95,159,0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  barcodeText: {
    color: "#115f9f",
    fontWeight: "700",
    fontSize: 12,
  },
  titleprofile: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#115f9f",
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
  },
  titleprofile1: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#115f9f",
    marginBottom: 10,
    marginLeft: 10,
  },
  versions: {
    textAlign: "center",
    fontSize: 12,
    color: "#333",
    marginTop: "10%",
    fontWeight: "bold",
    opacity: 0.4,
    marginBottom: 20,
  },
  logoutModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  logoutModalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  logoutModalMessage: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  logoutModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    backgroundColor: "#115f9f",
    borderRadius: 5,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  infoCard: {
    width: "92%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(17,95,159,0.08)",
  },
  levelBadge: {
    backgroundColor: "#e6f3ff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    minWidth: 88,
  },
  levelLabel: {
    fontSize: 11,
    color: "#4a6078",
    letterSpacing: 0.2,
  },
  levelText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#115f9f",
    textTransform: "capitalize",
  },
});
function setOriginalBrightness(currentBrightness: number) {
  throw new Error("Function not implemented.");
}
