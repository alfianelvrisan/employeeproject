import { AuthProvider } from '../../context/AuthContext';
import React, { useState } from 'react';
import { Text, StyleSheet, View, FlatList, Dimensions } from 'react-native';

const bannerData = [
  {
    id: 1,
    title: 'Promo Diskon',
    description: 'Dapatkan diskon hingga 50% untuk semua produk!',
    createdAt: '2023-10-01',
  },
  {
    id: 2,
    title: 'Gratis Ongkir',
    description: 'Nikmati gratis ongkir untuk pembelian di atas Rp 100.000.',
    createdAt: '2023-10-02',
  },
  {
    id: 3,
    title: 'Produk Baru',
    description: 'Cek koleksi produk terbaru kami sekarang juga!',
    createdAt: '2023-10-03',
  },
];

const BannerNotification = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideWidth = Dimensions.get('window').width * 0.9; // Adjusted for smaller card width
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setCurrentIndex(index);
  };

  return (
    <AuthProvider>
    <View style={styles.container}>
        <Text style={styles.texttile}>Information</Text>
      <FlatList
        data={bannerData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.imagePlaceholder} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.date}>Created at: {item.createdAt}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.pagination}>
        {bannerData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20, // Add spacing below the banner
  },
  card: {
    width: Dimensions.get('window').width * 0.9, // Reduce card width
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    textShadowRadius: 3,
    elevation: 2,
    marginHorizontal: Dimensions.get('window').width * 0.007, // Center the card
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#fff7c2',
    borderBottomWidth: 1,
    borderColor: '#ffd85f',
  },
  textContainer: {
    padding: 15, // Add spacing around text
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#115f9f',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#333',
  },
  inactiveDot: {
    backgroundColor: '#aaa',
  },
  texttile : {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#115f9f',
    marginBottom: 10,
    marginLeft: 10,
  }
});

export default BannerNotification;
