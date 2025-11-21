import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import ParallaxScrollView from '@/components/ParallaxScrollView';


const categories = [
  { name: 'Buah Lokal', icon: require('@/assets/icons/buah_lokal.png') },
  { name: 'Buah Import', icon: require('@/assets/icons/buah_import.png') },
  { name: 'Snack', icon: require('@/assets/icons/snack.png') },
  { name: 'Minuman', icon: require('@/assets/icons/minuman.png') },
  { name: 'Roti', icon: require('@/assets/icons/roti.png') },
  { name: 'Sayuran', icon: require('@/assets/icons/sayuran.png') },
  { name: 'Frozen Food', icon: require('@/assets/icons/frozen_food.png') },
  { name: 'Grosir', icon: require('@/assets/icons/grosir.png') },
];

const products = [
  { id:1,name: 'APEL FUJI A', image: require('@/assets/buah/apel_fj.jpg'),rating: 4.5 ,harga:20000,satuan:'1.00 kg'},
  { id:2,name: 'ANGGUR HIJAU', image: require('@/assets/buah/anggur_hijau.png'),rating: 4.5 ,harga:20000,satuan:'1.00 kg'},
  { id:3,name: 'KELENGKENG MERAH', image: require('@/assets/buah/kelengkeng.png'),rating: 4.1 ,harga:20000,satuan:'1.00 kg'},
  { id:4,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
  { id:5,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
  { id:6,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
  { id:7,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
  { id:8,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
  { id:9,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
  { id:10,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
  { id:11,name: 'PISANG', image: require('@/assets/buah/pisang.png'),rating: 4.1 ,harga:20000,satuan:'1.00 Dus : 6.30 kg'},
];

export default function Produk() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const shakeAnimation = useSharedValue(0);

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(categoryName);
    shakeAnimation.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  const handleLikePress = (productId: number) => {
    if (likedProducts.includes(productId)) {
      setLikedProducts(likedProducts.filter((id) => id !== productId));
    } else {
      setLikedProducts([...likedProducts, productId]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category, index) => {
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: selectedCategory === category.name ? shakeAnimation.value : 0 }],
          }));

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                selectedCategory === category.name && styles.selectedCard,
              ]}
              onPress={() => handleCategoryPress(category.name)}
            >
              <Animated.View style={animatedStyle}>
                <Image source={category.icon} style={styles.icon} />
                <Text
                  style={[
                    styles.text,
                    selectedCategory === category.name && styles.selectedText,
                  ]}
                >
                  {category.name}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
        <View style={styles.productContainer}>
          {products.map((product) => {
            const isLiked = likedProducts.includes(product.id);
            const loveAnimation = useSharedValue(0);

            const animatedStyle = useAnimatedStyle(() => ({
              transform: [{ scale: loveAnimation.value }],
              opacity: loveAnimation.value,
            }));

            const handleLoveAnimation = () => {
              loveAnimation.value = withTiming(1, { duration: 300 }, () => {
                loveAnimation.value = withTiming(0, { duration: 300 });
              });
            };

            return (
              <View key={product.id} style={styles.productCard}>
                <Image source={product.image} style={styles.productImage} />
                <Ionicons name='add' size={20} style={styles.add_cart}></Ionicons>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.satuan}>{product.satuan}</Text>
                <Text style={styles.price}>Rp {product.harga}</Text>
                <Text style={styles.totalLikesText}>{likedProducts.length} Like</Text>
                <TouchableOpacity
                  onPress={() => {
                    handleLikePress(product.id);
                    handleLoveAnimation();
                  }}
                  style={styles.heartContainer}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={19}
                    color={isLiked ? "red" : "#fff"}
                    style={styles.stars}
                  />
                  <Text style={styles.ratings}></Text>
                  <Animated.View style={[styles.loveAnimation, animatedStyle]}>
                    <Text style={styles.loveText}>💙</Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingHorizontal: 10,
    top: 175,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    width: 80,
    height: 80, 
  },
  selectedCard: {
    backgroundColor: '#c3eaff',
  },
  icon: {
    width: 25,
    height: 25,
    marginBottom: 5,
    resizeMode: 'contain',
    marginHorizontal: 'auto',
  },
  text: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
  },
  containers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    top:10,
  },
  scrollableProductContainer: {
    top: 2,
    height: 400,
  },
  productContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    top: 15,
    marginBottom: '65%',
  },
  productCard: {
    backgroundColor: '#fff',
    width: '49%', // Ensure two cards per row
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
    bottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
  },
  ratings:{
    position:'absolute',
    alignSelf: 'flex-end',
    backgroundColor: '#115f9f',
    color: '#fff',
    padding: 3,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    width: 40,
    left:-29.5,
  },
  stars : {
    zIndex:1,
    position:'absolute',
    alignSelf: 'flex-end',
    right: 5,
    padding: 3,
  },
  price:{
    fontSize: 14,
    color: '#115f9f',
    alignSelf: 'flex-start',
    top: 5,
  },
  satuan:{
    fontSize: 12,
    color: '#333',
    alignSelf: 'flex-start',
    top: 5,
    bottom: 5,
    opacity: 0.5,
  },
  heartContainer: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: 5,
    padding: 3,
  },
  loveAnimation: {
    position: 'absolute',
    alignSelf: 'center',
    top: -20,
  },
  loveText: {
    fontSize: 20,
    color: '#115f9f',
  },
  totalLikesText: {
    fontSize: 12,
    color: '#333',
    position: 'absolute',
    bottom: 7,
    alignSelf: 'flex-end',
    right: 5,
    opacity: 0.5,
  },
  add_cart : {
    alignSelf: 'flex-end',
    backgroundColor: '#115f9f',
    padding: 3,
    borderRadius: 100,
    color: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 3,
  }
});