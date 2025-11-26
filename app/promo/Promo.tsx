import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";

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
    image: "https://via.placeholder.com/150",
    category: "Diskon",
    validUntil: "2023-10-15",
  },
  {
    id: 2,
    title: "Cashback 20%",
    description: "Nikmati cashback 20% untuk setiap transaksi.",
    image: "https://via.placeholder.com/150",
    category: "Cashback",
    validUntil: "2023-10-20",
  },
  {
    id: 3,
    title: "Gratis Ongkir",
    description: "Gratis ongkir untuk pembelian di atas Rp100.000.",
    image: "https://via.placeholder.com/150",
    category: "Gratis",
    validUntil: "2023-10-25",
  },
  {
    id: 4,
    title: "Diskon Spesial",
    description: "Diskon spesial untuk pelanggan setia.",
    image: "https://via.placeholder.com/150",
    category: "Diskon",
    validUntil: "2023-10-30",
  },
];

const tabs = [
  {
    id: 1,
    name: "🥈 Member Silver",
    description: "Tingkat Dasar – Cocok untuk pelanggan baru yang ingin mulai bergabung dengan Laskar Buah.",
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
    name: "🥇 Member Premium",
    description: "Tingkat Menengah – Untuk pelanggan setia yang ingin lebih banyak manfaat.",
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
    name: "💎 Member Platinum",
    description: "Tingkat Tertinggi – Untuk mitra dan pelanggan VIP yang mendukung visi 1000 toko Laskar Buah.",
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
    image: "https://via.placeholder.com/300x200",
    link: "https://www.instagram.com/p/DJoPE70xgM_/",
  },
  {
    id: 2,
    image: "https://via.placeholder.com/300x200",
    link: "https://www.instagram.com/p/DJoPE70xgM_/",
  },
  {
    id: 3,
    image: "https://via.placeholder.com/300x200",
    link: "https://www.instagram.com/p/DJoPE70xgM_/",
  },
];

const Promo = () => {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedTab, setSelectedTab] = useState("🥈 Member Silver");

  const filteredPromos =
    selectedCategory === "Semua"
      ? promos
      : promos.filter((promo) => promo.category === selectedCategory);

  const selectedTabDetails = tabs.find((tab) => tab.name === selectedTab);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Promo</Text>
      {/* Horizontal scrollable category section */}
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
      {/* Promo cards */}
      {filteredPromos.map((promo) => (
        <TouchableOpacity key={promo.id} style={styles.card}>
          <Image source={{ uri: promo.image }} style={styles.cardImage} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{promo.title}</Text>
            <Text style={styles.cardDescription}>{promo.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>Berlaku hingga: {promo.validUntil}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{promo.category}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      <Text style={styles.header}>Keuntungan Member</Text>
      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.name && styles.selectedTab,
            ]}
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
      {/* Benefits Section */}
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsHeader}>{selectedTab}</Text>
        <Text style={styles.description}>{selectedTabDetails?.description}</Text>
        {selectedTabDetails?.benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <Text style={styles.benefitText}>• {benefit}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.header}>Galeri Instagram</Text>
      {/* Instagram Image Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.instagramContainer}
      >
        {instagramImages.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.instagramCard}
            onPress={() => {
              // Open Instagram link
              window.open(item.link, "_blank");
            }}
          >
            <Image source={{ uri: item.image }} style={styles.instagramImage} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  categoryContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  badge: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: "#000",
    fontSize: 14,
  },
  selectedBadge: {
    backgroundColor: "#115f9f",
  },
  selectedBadgeText: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
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
    marginBottom: 15,
  },
  tab: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 15,
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
  },
  instagramImage: {
    width: 300,
    height: 200,
    resizeMode: "cover",
  },
});

export default Promo;
