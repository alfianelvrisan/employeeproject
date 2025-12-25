import { useEffect, useState } from "react";
import * as Location from "expo-location";

type Coordinates = {
  latitude: number;
  longitude: number;
};

const formatReverseAddress = (data: Location.LocationGeocodedAddress | null) => {
  if (!data) {
    return "Lokasi dipilih manual";
  }
  const { name, street, district, city, region } = data;
  return (
    [name || street, district || city || region]
      .filter(Boolean)
      .join(", ") || "Lokasi dipilih manual"
  );
};

export default function useLocationData(
  onSelectStore: (storeId: string) => void,
  userToken: string
) {
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apidata, setApidata] = useState<any>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [initialCoords, setInitialCoords] = useState<Coordinates | null>(null);

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

        const nextCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        const { latitude, longitude } = nextCoords;
        setCoords(nextCoords);
        setInitialCoords((prev) => prev ?? nextCoords);

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

        setLocation(formatReverseAddress(reverseGeocode[0] ?? null));

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

  const updateLocationByCoords = async (coordinate: Coordinates) => {
    try {
      setCoords(coordinate);
      const reverseGeocode = await Location.reverseGeocodeAsync(coordinate);
      setLocation(formatReverseAddress(reverseGeocode[0] ?? null));

      const response = await fetch(
        `https://api.laskarbuah.com/api/location?latitute=${coordinate.latitude}&longitute=${coordinate.longitude}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const json = await response.json();
      setApidata(json);
      if (json.length > 0) {
        setSelectedStore(String(json[0].id));
        onSelectStore(String(json[0].id));
      }
    } catch (error) {
      setLocation("Lokasi manual tidak dikenali");
    }
  };

  const resetToInitialCoords = async () => {
    if (initialCoords) {
      await updateLocationByCoords(initialCoords);
    }
  };

  return {
    location,
    loading,
    apidata,
    selectedStore,
    setSelectedStore,
    coords,
    updateLocationByCoords,
    initialCoords,
    resetToInitialCoords,
  };
}
