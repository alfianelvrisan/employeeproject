import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from "../../context/AuthContext";
import {cekTrxMember} from "../../services/cekTrxMember";
import React from 'react';
import CustomHeader from '../../components/CustomHeaderTransparan';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { userToken } = useAuth();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTransparent: true,
            headerStyle: {
              backgroundColor: "transparent", 
            },
            headerTitle: "SCAN QR",
            headerTitleAlign: 'center',
            headerTintColor: "#fff",
            headerRight: () => (
              <TouchableOpacity
                style={{ padding: 10 }}
              >
                <Ionicons name="qr-code" size={20} color="#fff" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.permissionCard}>
          <Ionicons name="camera" size={40} color="#111" />
          <Text style={styles.permissionTitle}>Akses Kamera Dibutuhkan</Text>
          <Text style={styles.message}>Izinkan kamera untuk memindai QR Code.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);

    try {
      const id = Number.parseInt(data, 10);
      if (!Number.isFinite(id)) {
        Alert.alert("QR tidak valid");
        return;
      }

      const response = await cekTrxMember(id, String(userToken));
      if(response === "0") {
        Alert.alert("Transaksi tidak ditemukan");
        return;
      }else{
        router.push({
          pathname: "/scan/scanDetail/approvetransaksi",
          params: { id }
        })
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Gagal memproses QR", "Coba lagi dalam beberapa saat.");
    } finally {
      setScanned(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
          options={{
            headerShown: false,
            headerTransparent: true, // Header transparan
            headerStyle: {
              backgroundColor: "transparent", // Pastikan tidak ada warna latar
            },
            headerTitle: "SCAN QR",
            headerTitleAlign: 'center',
            headerTintColor: "#fff",
            headerRight: () => (
              <TouchableOpacity
                style={{ padding: 10 }}
              >
                <Ionicons name="qr-code" size={20} color="#fff" />
              </TouchableOpacity>
            ),
          }}
        />
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View pointerEvents="box-none" style={styles.overlay}>
        <CustomHeader title="Scan Qr Code"/>
        <View style={styles.scanHintWrap}>
          <Text style={styles.scanTitle}>Arahkan QR di dalam kotak</Text>
          <Text style={styles.scanSubtitle}>Pemindaian akan otomatis</Text>
        </View>
        <View style={styles.scannerMask}>
          <View style={styles.scannerBox}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            <View style={styles.scanLine} />
          </View>
        </View>

        {/* Tombol flip kamera */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0c0f14',
  },
  message: {
    textAlign: 'center',
    color: '#2b2b2b',
    marginTop: 8,
    marginBottom: 18,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionCard: {
    alignSelf: 'center',
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  permissionTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  permissionButton: {
    marginTop: 6,
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scanHintWrap: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scanSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  scannerMask: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: 260,
    height: 260,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ffe133',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 20,
    height: 2,
    backgroundColor: 'rgba(255, 225, 51, 0.9)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
