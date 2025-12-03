import { AuthProvider } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  StatusBar,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import CustomHeader from "../../components/CustomHeader";
const imagesbaner = require("../../assets/images/bannernotification1.jpg");

const category = [
  { id: 1, name: "Yang Baru" },
  { id: 4, name: "Diskon" },
];

const notifikasi: any[] = [
  {
    title: "Rilis Aplikasi Baru LBI Mobile",
    description:
      "Versi terbaru siap dicoba! Update untuk tampilan lebih segar dan notifikasi real-time.",
    date: "2025-02-01",
    category: "Yang Baru",
    image: imagesbaner,
  },
  {
    title: "Diskon Buah Segar 20%",
    description: "Nikmati potongan 20% untuk buah favoritmu sepanjang minggu ini.",
    date: "2025-02-05",
    category: "Diskon",
    image: {
      uri: "https://webportallaskarbuah.is3.cloudhost.id/webportallaskarbuah/news_media/j40fMq4gqFOhd1S8O3zIauETGveriQ1TZlh3f2XT.png",
    },
  },
];

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState('Diskon');

  const filteredNotifications =
    selectedCategory === 'Diskon'
      ? notifikasi
      : notifikasi.filter((item) => item.category === selectedCategory);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <CustomHeader title="Notification" />
          <Stack.Screen
            options={{
              headerShown: false, // Hide header for the main profile screen
            }}
          />
          <ScrollView style={styles.scrollView}>
            {/* Horizontal scrollable category section */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
            >
              {category.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.badge,
                    selectedCategory === category.name && styles.selectedBadge,
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      selectedCategory === category.name &&
                        styles.selectedBadgeText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Notification cards */}
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((item, index) => (
                <TouchableOpacity key={index} style={styles.card}>
                  <Image source={item.image} style={styles.cardImage} />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDescription}>
                      {item.description}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardDate}>{item.date}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={50}
                  color="#ccc"
                />
                <Text style={styles.emptyText}>Belum ada notifikasi</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    padding: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: '#000',
    fontSize: 14,
  },
  selectedBadge: {
    backgroundColor: '#115f9f',
  },
  selectedBadgeText: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  categoryBadge: {
    backgroundColor: '#115f9f',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default App;
