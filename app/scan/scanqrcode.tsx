import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthProvider } from "../../context/AuthContext";
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
        <Text style={styles.message}>We need your permission to show the camera</Text>
      <View style={styles.button1}>
        <Button
          onPress={requestPermission}
          title="Grant permission"
        />
      </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true); 
  
    try {
      const id = parseInt(data);
      const response = await cekTrxMember(id, String(userToken));
      if(response === "0") {
        Alert.alert("Transaksi tidak ditemukan");
        setScanned(false);
        return;
      }else{
        router.push({
          pathname: "/scan/scanDetail/approvetransaksi",
          params: { id }
        })
        setScanned(false);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <AuthProvider>
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
      >
        <CustomHeader title="Scan Qr Code"/>
        {/* Kotak tengah fokus (scanner box) */}
        <View style={styles.scannerBox} />

        {/* Tombol flip kamera */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}><Ionicons name="camera-reverse" size={35} color="#fff" /></Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    borderRadius: 10,
  },
  camera: {
    flex: 1,
  },
  scannerBox: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    height: 300,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 15,
    // backgroundColor: 'rgba(0, 0, 0, 0.3)', 
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  button1:{
    width: "70%",
    marginHorizontal:"auto"
  }
});
