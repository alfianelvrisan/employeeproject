import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function LocationComponent() {
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Permission denied');
        setLoading(false);
        return;
      }

      // Watch position for faster updates
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 10 },
        async (currentLocation) => {
          const { latitude, longitude } = currentLocation.coords;

           // Reverse geocoding to get address
          const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (reverseGeocode.length > 0) {
            const { district, city } = reverseGeocode[0];
            setLocation(`${district}, ${city}`);
          } else {
            setLocation('Location not found');
          }
          setLoading(false);
        }
      );

      return () => subscription.remove(); // Cleanup subscription
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="small" color="#115f9f" />
        ) : (
          <Text style={styles.locations}>
            <Ionicons name="location" size={15} color="#115f9f" /> {location || 'Unknown Location'}
          </Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.locations}>
          <Ionicons name="home" size={15} color="#115f9f" /> Dander 1, 12 Km
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    top: 180,
  },
  card: {
    backgroundColor: '#fff',
    width: '49%',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    justifyContent: 'center',
  },
  locations: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 14,
  },
});