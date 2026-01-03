import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, ScrollView, View, Image, TextInput, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { updateProfile } from "../../../services/profileUpdate";
import CustomHeader from "../../../components/CustomHeader";


const App = () => {
  const { userToken, fetchProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [profil, setProfile] = useState<{
    nama: string;
    greeting: string;
    alamat: string;
    foto: string;
    no_tlp: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    ktp: string;
    email?: string;
  } | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (userToken) {
      fetchProfile()
        .then((profile) => {
          setProfile(profile);
          setFormNama(profile?.nama || "");
          setFormEmail(profile?.email || "");
          setFormAlamat(profile?.alamat || "");
        })
        .catch((error) => console.warn(error.message));
    }
  }, [userToken]);

  const handleSaveProfile = async () => {
    if (!userToken) {
      Alert.alert("Gagal", "Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    if (!formNama.trim() || !formEmail.trim() || !formAlamat.trim()) {
      Alert.alert("Lengkapi Data", "Nama, email, dan alamat wajib diisi.");
      return;
    }
    try {
      setIsSaving(true);
      const updated = await updateProfile(userToken, {
        nama: formNama.trim(),
        email: formEmail.trim(),
        alamat: formAlamat.trim(),
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert("Gagal", (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <SafeAreaProvider>
      <Stack.Screen
                options={{
                  headerShown: false,
                  headerTitle: "Notifikasi",
                  headerTitleAlign: "center",
                  headerStyle: {
                    backgroundColor: "#fff",
                  },
                  headerTintColor: "#115f9f",
                }}
              />
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
          <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
            <CustomHeader title="Detail Profil" variant="accent" />
          </View>
          <ScrollView contentContainerStyle={styles.scrollView}>
            {/* Profile Header */}
            <View style={styles.headerCard}>
              <View style={styles.avatarRing}>
                <Image
                  source={{
                    uri:
                      profil?.foto ||
                      "https://is3.cloudhost.id/webportallaskarbuah/webportallaskarbuah/logo/LBI%20ORI.png",
                  }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profil?.nama || "Nama Tidak Ditemukan"}
                </Text>
                <Text style={styles.profileGreeting}>
                  {profil?.greeting || "Selamat Datang!"}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Data Pribadi</Text>
            <View style={styles.sectionCard}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBubble}>
                    <Ionicons name="card-outline" size={18} color="#115f9f" />
                  </View>
                  <Text style={styles.rowLabel}>NIK</Text>
                </View>
                <Text style={styles.rowValue}>{profil?.ktp || "-"}</Text>
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBubble}>
                    <Ionicons name="person-outline" size={18} color="#115f9f" />
                  </View>
                  <Text style={styles.rowLabel}>Nama</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formNama}
                  onChangeText={setFormNama}
                  placeholder="Nama"
                />
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBubble}>
                    <Ionicons name="call-outline" size={18} color="#115f9f" />
                  </View>
                  <Text style={styles.rowLabel}>Telepon</Text>
                </View>
                <Text style={styles.rowValue}>{profil?.no_tlp || "-"}</Text>
              </View>
              <View style={styles.rowDivider} />
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBubble}>
                    <Ionicons name="mail-outline" size={18} color="#115f9f" />
                  </View>
                  <Text style={styles.rowLabel}>Email</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Alamat</Text>
            <View style={styles.sectionCard}>
              <View style={[styles.row, styles.rowTopAligned]}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBubble}>
                    <Ionicons name="location-outline" size={18} color="#115f9f" />
                  </View>
                  <Text style={styles.rowLabel}>Alamat</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  value={formAlamat}
                  onChangeText={setFormAlamat}
                  placeholder="Alamat"
                  multiline
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <Modal
            transparent
            animationType="fade"
            visible={showSuccessModal}
            onRequestClose={() => setShowSuccessModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalIcon}>
                  <Ionicons name="checkmark" size={28} color="#115f9f" />
                </View>
                <Text style={styles.modalTitle}>Profil Tersimpan</Text>
                <Text style={styles.modalMessage}>
                  Perubahan sudah berhasil disimpan. Data kamu sudah terbarui.
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </SafeAreaProvider>
  );
};

const PALETTE = {
  background: "#fffdf5",
  card: "#ffffff",
  border: "#efe7c4",
  accent: "#fff247",
  accentSoft: "#fff8d7",
  textPrimary: "#3a2f00",
  textMuted: "#6f5a1a",
  icon: "#b08d00",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  scrollView: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerWrap: {
    backgroundColor: PALETTE.accent,
  },
  headerCard: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: PALETTE.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: PALETTE.textPrimary,
  },
  profileGreeting: {
    fontSize: 14,
    color: PALETTE.textMuted,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowTopAligned: {
    alignItems: "flex-start",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PALETTE.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.textPrimary,
  },
  rowValue: {
    fontSize: 14,
    color: PALETTE.textPrimary,
    textAlign: "right",
    maxWidth: "55%",
  },
  input: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    color: PALETTE.textPrimary,
    paddingVertical: 0,
  },
  addressInput: {
    textAlign: "right",
  },
  addressText: {
    textAlign: "right",
  },
  rowDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
  },
  saveButton: {
    marginTop: 6,
    backgroundColor: "#115f9f",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e6f0fa",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f3f6f",
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 13,
    color: "#4a5a6a",
    textAlign: "center",
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#115f9f",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default App;
