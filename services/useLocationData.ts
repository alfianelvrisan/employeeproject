import { useEffect, useState } from "react";
import * as Location from "expo-location";

export default function useLocationData(
  onSelectStore: (storeId: string) => void,
  userToken: string
) {
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [apidata, setApidata] = useState<any>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");

  useEffect(() => {
    const getLocationData = async () => {
      try {
        setLoading(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocation("Izin lokasi ditolak");
          setLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });

        const { latitude, longitude } = current.coords;
        setLatitude(latitude);
        setLongitude(longitude);

        const reversePromise = Location.reverseGeocodeAsync({ latitude, longitude });
        const fetchPromise = fetch(
          `https://api.laskarbuah.com/api/location?latitute=${latitude}&longitute=${longitude}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${userToken}`,
              "Content-Type": "application/json",
            },
          }
        ).then((res) => res.json());

        const [reverseGeocode, json] = await Promise.all([reversePromise, fetchPromise]);

        if (reverseGeocode.length > 0) {
          const { district, city } = reverseGeocode[0];
          setLocation(`${district ?? ""}, ${city ?? ""}`);
        } else {
          setLocation("Tidak dapat menemukan lokasi");
        }

        setApidata(json);
        if (json.length > 0 && !selectedStore) {
          setSelectedStore(String(json[0].id));
          onSelectStore(String(json[0].id));
        }

        setLoading(false);
      } catch (error) {
        setLocation("Terjadi kesalahan lokasi");
        setLoading(false);
      }
    };

    getLocationData();
  }, [userToken]);

  useEffect(() => {
    if (selectedStore) {
      onSelectStore(selectedStore);
    }
  }, [selectedStore]);

  return {
    location,
    loading,
    apidata,
    selectedStore,
    setSelectedStore,
  };
}
