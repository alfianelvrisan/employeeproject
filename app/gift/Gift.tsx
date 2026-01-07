import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import useScrollHeader from "../../hooks/useScrollHeader";

const categories = [
  { id: 1, name: "Semua" },
  { id: 2, name: "Diskon" },
  { id: 3, name: "Cashback" },
  { id: 4, name: "Gratis" },
];

const promos = [
  {
    id: 1,
    title: "Diskon 50%",
    description: "Dapatkan diskon hingga 50% untuk semua produk.",
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/test_img/2025/03/17/a75e37dd-da7f-4f52-8d0e-3dc1d5ddc508.jpg",
    category: "Diskon",
    validUntil: "2023-10-15",
  },
  {
    id: 2,
    title: "Cashback 20%",
    description: "Nikmati cashback 20% untuk setiap transaksi.",
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/hxFTh725jTwjldhAL4sWeTHtTwSofLRomTc4UmEa.jpg",
    category: "Cashback",
    validUntil: "2023-10-20",
  },
  {
    id: 3,
    title: "Gratis Ongkir",
    description: "Gratis ongkir untuk pembelian di atas Rp100.000.",
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/j40fMq4gqFOhd1S8O3zIauETGveriQ1TZlh3f2XT.png",
    category: "Gratis",
    validUntil: "2023-10-25",
  },
  {
    id: 4,
    title: "Diskon Spesial",
    description: "Diskon spesial untuk pelanggan setia.",
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/1QJk7s8Bs5otxpgvVsU6NBvpBwgRFXtf3swNrrZF.jpg",
    category: "Diskon",
    validUntil: "2023-10-30",
  },
];

const tabs = [
  {
    id: 1,
    name: "Member Silver",
    description:
      "Tingkat Dasar - Cocok untuk pelanggan baru yang ingin mulai bergabung dengan Laskar Buah.",
    benefits: [
      "Diskon 5% untuk pembelian buah segar.",
      "Akses prioritas ke promo mingguan.",
      "Poin loyalitas: 1 poin setiap belanja Rp10.000.",
      "Undangan ke event bazar khusus anggota.",
      "Layanan pelanggan khusus member.",
    ],
  },
  {
    id: 2,
    name: "Member Premium",
    description:
      "Tingkat Menengah - Untuk pelanggan setia yang ingin lebih banyak manfaat.",
    benefits: [
      "Diskon 10% untuk semua produk buah dan olahan.",
      "Double poin loyalitas: 2 poin setiap belanja Rp10.000.",
      "Akses eksklusif ke pre-order buah impor dan musiman.",
      "Bonus ulang tahun berupa voucher belanja Rp50.000.",
      "Layanan pengantaran prioritas (jika tersedia).",
      "Undangan khusus ke pelatihan dan workshop kewirausahaan buah.",
    ],
  },
  {
    id: 3,
    name: "Member Platinum",
    description:
      "Tingkat Tertinggi - Untuk mitra dan pelanggan VIP yang mendukung visi 1000 toko Laskar Buah.",
    benefits: [
      "Diskon 15% + cashback 5% setiap pembelian.",
      "Triple poin loyalitas: 3 poin setiap belanja Rp10.000.",
      "Konsultasi bisnis dan kemitraan gratis (1-on-1).",
      "Akses ke produk eksklusif dan edisi terbatas.",
      "Undangan ke gathering nasional Laskar Buah.",
      "Prioritas kerjasama sebagai mitra distribusi/toko.",
      "Bonus voucher tahunan senilai Rp500.000.",
      "Dukungan branding dan promosi toko (bagi mitra).",
    ],
  },
];

const instagramImages = [
  {
    id: 1,
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/test_img/2025/03/17/a75e37dd-da7f-4f52-8d0e-3dc1d5ddc508.jpg",
    link:
      "https://laskarbuah.com/news/Anggur-Hijau-Muscat-Keharuman-Memikat-dan-Rasa-Menyegarkan-Hanya-di-Laskar-Buah",
  },
  {
    id: 2,
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/hxFTh725jTwjldhAL4sWeTHtTwSofLRomTc4UmEa.jpg",
    link:
      "https://laskarbuah.com/news/Alpukat-Mentega-Kelezatan-Premium-yang-Mudah-Anda-Temukan-di-Seluruh-Laskar-Buah",
  },
  {
    id: 3,
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/j40fMq4gqFOhd1S8O3zIauETGveriQ1TZlh3f2XT.png",
    link:
      "https://laskarbuah.com/news/Apel-Merah-Top-Red-Merah-Merona-Manis-Menyegarkan-Hanya-di-Laskar-Buah",
  },
  {
    id: 4,
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/1QJk7s8Bs5otxpgvVsU6NBvpBwgRFXtf3swNrrZF.jpg",
    link:
      "https://laskarbuah.com/news/Apel-Fuji-Manisnya-Menyegarkan-Renyahnya-Menggoda-Tersedia-dalam-Berbagai-Ukuran-di-Laskar-Buah",
  },
  {
    id: 5,
    image:
      "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/RAM9IyLWUj7xOTJ8ioXdUxiHoW77kYMhdXYWI5f2.webp",
    link:
      "https://laskarbuah.com/news/Anggur-Hitam-Lokal-Manis-Alami-dan-Segar-Dukung-Petani-Kita-Bersama-Laskar-Buah",
  },
];

const Gift = () => {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedTab, setSelectedTab] = useState("Member Silver");
  const { headerStyle, handleScroll } = useScrollHeader();

  const filteredPromos =
    selectedCategory === "Semua"
      ? promos
      : promos.filter((promo) => promo.category === selectedCategory);

  const selectedTabDetails = tabs.find((tab) => tab.name === selectedTab);

  return (
    <LinearGradient
      colors={["#cde7ff", "#e6f3ff", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.4 }}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.floatingHeader, headerStyle]}>
          <Text style={styles.headerTitle}>Gift Laskar Buah</Text>
        </Animated.View>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />
          <View style={styles.headerSpacer} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, selectedTab === tab.name && styles.selectedTab]}
                onPress={() => setSelectedTab(tab.name)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab.name && styles.selectedTabText,
                  ]}
                >
                  {tab.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsHeader}>{selectedTab}</Text>
            <Text style={styles.description}>
              {selectedTabDetails?.description}
            </Text>
            {selectedTabDetails?.benefits?.map((benefit, index) => (
              <View key={`${benefit}-${index}`} style={styles.benefitItem}>
                <Text style={styles.benefitText}>- {benefit}</Text>
              </View>
            ))}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.badge,
                  selectedCategory === category.name && styles.selectedBadge,
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <Text
                  style={[
                    styles.badgeText,
                    selectedCategory === category.name && styles.selectedBadgeText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredPromos.map((promo) => (
            <TouchableOpacity key={promo.id} style={styles.card}>
              <Image source={{ uri: promo.image }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{promo.title}</Text>
                <Text style={styles.cardDescription}>{promo.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>
                    Berlaku hingga: {promo.validUntil}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{promo.category}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.header}>Galeri Laskar Buah</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.instagramContainer}
          >
            {instagramImages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.instagramCard}
                onPress={() => Linking.openURL(item.link).catch(() => {})}
              >
                <Image source={{ uri: item.image }} style={styles.instagramImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 10,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 12,
    textAlign: "center",
    color: "#115f9f",
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "rgba(17,95,159,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
    shadowColor: "#0a3e7a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    paddingTop: 26,
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSpacer: {
    height: 56,
  },
  categoryContainer: {
    flexDirection: "row",
    marginBottom: 15,
    marginTop: 14,
  },
  badge: {
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowOpacity: 0,
    elevation: 0,
  },
  badgeText: {
    color: "#000",
    fontSize: 14,
  },
  selectedBadge: {
    backgroundColor: "#115f9f",
    borderColor: "#115f9f",
  },
  selectedBadgeText: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 12,
    color: "#999",
  },
  categoryBadge: {
    backgroundColor: "#115f9f",
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 12,
    marginTop: 6,
  },
  tab: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  selectedTab: {
    backgroundColor: "#115f9f",
  },
  tabText: {
    color: "#000",
    fontSize: 14,
  },
  selectedTabText: {
    color: "#fff",
  },
  benefitsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 18,
  },
  benefitsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  benefitItem: {
    marginBottom: 5,
  },
  benefitText: {
    fontSize: 14,
    color: "#666",
  },
  instagramContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  instagramCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginRight: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  instagramImage: {
    width: 300,
    height: 300,
    resizeMode: "cover",
  },
  bottomSpacer: {
    height: 80,
    backgroundColor: "#fff",
  },
});

export default Gift;
