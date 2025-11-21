import { StyleSheet, Text, ScrollView } from 'react-native';
import Search from '@/app/search/search';
import Produk from '../produk/produk';
import { HelloWave } from '@/components/HelloWave';
import Cardhome from '../cardHome/cardhome';
import Location from '../location/location';
import React from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native-reanimated/lib/typescript/Animated';

export default function indx() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <Text style={styles.background}></Text>
          <Text style={styles.name}>
            Good Morning,<Text style={styles.names}> Eki Prastyan</Text>
            <HelloWave />
          </Text>
          <Cardhome />
          <Location />
          <Search />
          <Produk />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  banner: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  background: {
    backgroundColor: '#c3eaff',
    width: '100%',
    height: 110,
    position: 'absolute',
  },
  name: {
    marginLeft: 20,
    color: '#115f9f',
    top: 11,
    zIndex: 2,
  },
  names: {
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  scrollView: {
   flex: 1,
  },
});