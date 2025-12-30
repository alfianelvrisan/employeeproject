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
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Brightness from "expo-brightness";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile } from "../../services/profileServices";
import useScrollHeader from "../../hooks/useScrollHeader";

const goldmember = require("../../assets/images/silver.png");
const gold2 = require("../../assets/images/gold2.png");
const goldlogo = require("../../assets/images/silverlogo.png");
const goldlogo2 = require("../../assets/images/goldslogo.png");
const premiumlogo = require("../../assets/images/premiumlogo.png");
const diamond = require("../../assets/images/diamond.png");

// Palette
const PALETTE = {
  primaryYellow: "#fff247",
  primaryPink: "#de0866",
  darkText: "#3a2f00",
  mutedText: "#8c8c8c",
  lightBg: "#fffdf5", // Soft yellow tint for body
  white: "#ffffff",
  border: "#f0f0f0",
};

const benefitsMap: Record<string, string[]> = {
  silver: [
    "Diskon 5% untuk pembelian buah segar.",
    "Akses prioritas ke promo mingguan.",
    "Poin loyalitas: 1 poin setiap belanja Rp10.000.",
    "Undangan ke event bazar khusus anggota.",
    "Layanan pelanggan khusus member.",
  ],
  gold: [
    "Diskon 10% untuk semua produk buah dan olahan.",
    "Double poin loyalitas: 2 poin setiap belanja Rp10.000.",
    "Akses eksklusif ke pre-order buah impor dan musiman.",
    "Bonus ulang tahun berupa voucher belanja Rp50.000.",
    "Layanan pengantaran prioritas.",
    "Undangan khusus ke pelatihan dan workshop kewirausahaan buah.",
  ],
  platinum: [
    "Diskon 15% + cashback 5% setiap pembelian.",
    "Triple poin loyalitas: 3 poin setiap belanja Rp10.000.",
    "Produk eksklusif & edisi terbatas.",
    "Undangan gathering nasional Laskar Buah.",
    "Prioritas kerjasama sebagai mitra distribusi/toko.",
    "Bonus voucher tahunan senilai Rp500.000.",
    "Dukungan branding dan promosi toko (bagi mitra).",
  ],
};

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
  const currentTransaction = current || 0;
  const targetTransaction = target || 1;

  const [profil, setProfile] = React.useState<{
    nama: string;
    member_card: number;
    no_tlp: string;
    rankd: string;
    pencapaian: number;
    target: number;
  } | null>(null);

  const normalizedRank = (rank || "").toLowerCase();
  const displayRank =
    normalizedRank === "silver" ||
      normalizedRank === "bronze" ||
      normalizedRank === ""
      ? "Silver"
      : normalizedRank.charAt(0).toUpperCase() + normalizedRank.slice(1);
  const benefitKey =
    normalizedRank === "silver" ||
      normalizedRank === "bronze" ||
      normalizedRank === ""
      ? "silver"
      : normalizedRank;

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
          setTarget(profile.target);
          setCurrent(profile.pencapaian);
        })
        .catch((error) => console.warn(error.message));
    }
  }, [userToken]);

  const toggleModal = async () => {
    if (!isModalVisible) {
      const currentBrightness = await Brightness.getBrightnessAsync();
      setOriginalBrightness(currentBrightness);
      await Brightness.setBrightnessAsync(1);
    } else {
      if (originalBrightness !== null) {
        await Brightness.setBrightnessAsync(originalBrightness);
      }
    }
    setModalVisible(!isModalVisible);
  };

  const closeModal = async () => {
    if (originalBrightness !== null) {
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
        <StatusBar
          barStyle="dark-content"
          backgroundColor={PALETTE.primaryYellow}
        />
        <View style={styles.container}>
          {/* Header Background */}
          <View style={styles.headerBg} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* User Info Card */}
            <View style={styles.profileHeader}>
              <View style={styles.profileInfo}>
                <Text style={styles.welcomeText}>Halo, Selamat Datang!</Text>
                <Text style={styles.profileName}>
                  {profil?.nama || "Member LBI"}
                </Text>
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileId}>
                    ID: {profil?.member_card || "-"}
                  </Text>
                  <View style={styles.dotSeparator} />
                  <Text style={styles.profilePhone}>
                    {profil?.no_tlp || "-"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.barcodeButton}
                onPress={toggleModal}
              >
                <Ionicons
                  name="qr-code"
                  size={24}
                  color={PALETTE.primaryPink}
                />
                <Text style={styles.barcodeText}>QR Code</Text>
              </TouchableOpacity>
            </View>

            {/* Member Card Shell */}
            <View style={styles.memberCardShell}>
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={14} color="#C99618" />
                <Text style={styles.rankText}>{displayRank} Member</Text>
              </View>

              <Image
                source={
                  normalizedRank === "gold"
                    ? gold2
                    : normalizedRank === "platinum"
                      ? diamond
                      : goldmember
                }
                style={styles.memberCardImage}
              />

              <Animated.Image
                source={
                  normalizedRank === "gold"
                    ? goldlogo2
                    : normalizedRank === "platinum"
                      ? premiumlogo
                      : goldlogo
                }
                style={[
                  styles.memberCardLogo,
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                  },
                ]}
              />
            </View>

            {/* Achievement Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="medal-outline" size={20} color={PALETTE.primaryPink} />
                <Text style={styles.sectionTitle}>Pencapaian Belanja</Text>
              </View>

              <View style={styles.achievementCard}>
                <View style={styles.achievementRow}>
                  <Text style={styles.achievementValue}>
                    Rp {current?.toLocaleString() || "0"}
                  </Text>
                  <Text style={styles.achievementTarget}>
                    / Rp {target?.toLocaleString() || "0"}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          (currentTransaction / targetTransaction) * 100,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.achievementNote}>
                  Belanja lagi untuk naik level!
                </Text>
              </View>
            </View>

            {/* Benefits Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="gift-outline" size={20} color={PALETTE.primaryPink} />
                <Text style={styles.sectionTitle}>Keuntungan Kamu</Text>
              </View>
              <View style={styles.benefitsCard}>
                {(benefitsMap[benefitKey] || benefitsMap.silver).map((item, idx) => (
                  <View key={`${item}-${idx}`} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={PALETTE.primaryPink} />
                    <Text style={styles.benefitText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Menu Section */}
            <View style={styles.menuContainer}>
              <Text style={styles.menuGroupTitle}>Akun Saya</Text>

              <Link href="/profile/subProfil/profil" asChild>
                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="person-circle-outline" size={22} color={PALETTE.darkText} />
                  </View>
                  <Text style={styles.menuText}>Edit Profil</Text>
                  <Ionicons name="chevron-forward" size={18} color={PALETTE.mutedText} />
                </TouchableOpacity>
              </Link>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/profile/subProfil/Notifikasi")}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="notifications-outline" size={22} color={PALETTE.darkText} />
                </View>
                <Text style={styles.menuText}>Notifikasi</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mutedText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  router.push({
                    pathname: "/profile/subProfil/changePin",
                    params: { whatsapp: profil?.no_tlp },
                  })
                }
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="key-outline" size={22} color={PALETTE.darkText} />
                </View>
                <Text style={styles.menuText}>Ganti PIN</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mutedText} />
              </TouchableOpacity>

              <Text style={[styles.menuGroupTitle, { marginTop: 20 }]}>Pusat Bantuan</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/profile/subProfil/SyaratKetentuan")}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="document-text-outline" size={22} color={PALETTE.darkText} />
                </View>
                <Text style={styles.menuText}>Syarat & Ketentuan</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mutedText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/profile/subProfil/PusatBantuan")}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="headset-outline" size={22} color={PALETTE.darkText} />
                </View>
                <Text style={styles.menuText}>Hubungi CS</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mutedText} />
              </TouchableOpacity>

              {/* Danger Zone */}
              <TouchableOpacity
                style={[styles.menuItem, styles.marginTop20]}
                onPress={handleLogout}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#ffebee' }]}>
                  <Ionicons name="log-out-outline" size={22} color={PALETTE.primaryPink} />
                </View>
                <Text style={[styles.menuText, { color: PALETTE.primaryPink }]}>Keluar Aplikasi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { }}
              >
                <View style={[styles.menuIconContainer]}>
                  <Ionicons name="trash-outline" size={22} color="#999" />
                </View>
                <Text style={[styles.menuText, { color: "#999" }]}>Hapus Akun</Text>
              </TouchableOpacity>

            </View>
            <Text style={styles.versionText}>Aplikasi Versi 1.0.0</Text>
          </ScrollView>

          {/* Barcode Modal */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={closeModal}
          >
            <TouchableWithoutFeedback onPress={closeModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Scan User ID</Text>
                      <TouchableOpacity onPress={closeModal}>
                        <Ionicons name="close" size={24} color="#333" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.barcodeWrapper}>
                      <QRCode value={barcodeValue} size={200} />
                    </View>
                    <Text style={styles.modalNote}>
                      Tunjukkan QR Code ini kepada kasir saat bertransaksi.
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Logout Modal */}
          <Modal
            visible={isLogoutModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setLogoutModalVisible(false)}
          >
            <View style={styles.logoutModalOverlay}>
              <View style={styles.logoutModalContent}>
                <Ionicons name="log-out" size={48} color={PALETTE.primaryPink} style={{ marginBottom: 10 }} />
                <Text style={styles.logoutModalTitle}>Konfirmasi Keluar</Text>
                <Text style={styles.logoutModalMessage}>
                  Apakah Anda yakin ingin keluar dari akun ini?
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
                    <Text style={styles.confirmButtonText}>Ya, Keluar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.white,
  },
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 120 + (StatusBar.currentHeight || 20) : 100,
    backgroundColor: PALETTE.primaryYellow,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 20,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: PALETTE.darkText,
    opacity: 0.7,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: PALETTE.darkText,
    marginBottom: 6,
  },
  profileDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileId: {
    fontSize: 13,
    fontWeight: "700",
    color: PALETTE.primaryPink,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PALETTE.darkText,
    marginHorizontal: 8,
    opacity: 0.3,
  },
  profilePhone: {
    fontSize: 13,
    color: PALETTE.darkText,
    fontWeight: "600",
  },
  barcodeButton: {
    backgroundColor: PALETTE.white,
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    height: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  barcodeText: {
    fontSize: 10,
    fontWeight: "700",
    color: PALETTE.primaryPink,
    marginTop: 4,
  },
  memberCardShell: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    height: 160,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  memberCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 20,
  },
  memberCardLogo: {
    position: "absolute",
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  rankBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 10,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: PALETTE.darkText,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PALETTE.darkText,
  },
  achievementCard: {
    backgroundColor: PALETTE.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
  },
  achievementValue: {
    fontSize: 20,
    fontWeight: "800",
    color: PALETTE.primaryPink,
  },
  achievementTarget: {
    fontSize: 14,
    color: PALETTE.mutedText,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: PALETTE.primaryPink,
    borderRadius: 4,
  },
  achievementNote: {
    fontSize: 12,
    color: PALETTE.mutedText,
    fontStyle: "italic",
  },
  benefitsCard: {
    backgroundColor: "#fffdf5", // Lightest yellow
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fff9c4",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    color: PALETTE.darkText,
    flex: 1,
    lineHeight: 18,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.mutedText,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.white,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: PALETTE.darkText,
  },
  marginTop20: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#ccc",
    marginBottom: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: PALETTE.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    minHeight: 350,
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PALETTE.darkText,
  },
  barcodeWrapper: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 24,
  },
  modalNote: {
    textAlign: "center",
    color: PALETTE.mutedText,
    fontSize: 13,
    paddingHorizontal: 20,
  },

  // Logout Modal
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoutModalContent: {
    width: "100%",
    backgroundColor: PALETTE.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 5,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: PALETTE.darkText,
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 14,
    color: PALETTE.mutedText,
    textAlign: "center",
    marginBottom: 24,
  },
  logoutModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.mutedText,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PALETTE.primaryPink,
    alignItems: "center",
  },
  confirmButtonText: {
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(17,95,159,0.08)",
  },
  levelBadge: {
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
  infoRow: {
    width: "92%",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
});
function setOriginalBrightness(currentBrightness: number) {
  throw new Error("Function not implemented.");
}
