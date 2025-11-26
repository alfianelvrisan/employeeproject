import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator, // Untuk indikator loading sederhana
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import CustomHeader from "../../components/CustomHeader";
import { scanKtp } from "../../services/_scanKtp"; // Pastikan path ini benar

// Definisikan interface untuk data KTP
interface KtpData {
  provinsi: string;
  kabupaten: string;
  nik: string;
  nama: string;
  tempatTglLahir: string;
  jenisKelamin: string;
  golDarah: string;
  alamat: string;
  rtRw: string;
  kelDesa: string;
  kecamatan: string;
  agama: string;
  statusPerkawinan: string;
  pekerjaan: string;
  kewarganegaraan: string;
  berlakuHingga: string;
}

// Komponen Skeleton Loading sederhana
const SkeletonLoading = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonLineShort} />
    <View style={styles.skeletonLineMedium} />
    <View style={styles.skeletonLineLong} />
    <View style={styles.skeletonLineMedium} />
    <View style={styles.skeletonLineShort} />
  </View>
);

const DisplayCapturedImage = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ktpData, setKtpData] = useState<KtpData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // State untuk loading
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null }); // State untuk pesan scan

  const handlePickImage = async () => {
    // Reset semua state saat mengambil gambar baru
    setKtpData(null);
    setCapturedImage(null);
    setIsLoading(false);
    setScanMessage({ text: '', type: null });

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Izin Ditolak", "Akses kamera diperlukan.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setCapturedImage(imageUri);
      setIsLoading(true); // Mulai loading setelah gambar diambil
    }
  };

  useEffect(() => {
    const processImage = async () => {
      if (capturedImage) {
        setIsLoading(true); // Pastikan loading aktif saat proses dimulai
        setScanMessage({ text: '', type: null }); // Reset pesan sebelumnya
        try {
          const scannedDataArray = await scanKtp(capturedImage);
          if (scannedDataArray && scannedDataArray.length > 0) {
            const parsedData = parseKtpData(scannedDataArray);

            // Validasi NIK
            if (parsedData.nik.length === 16) {
              setKtpData(parsedData);
              setScanMessage({ text: 'KTP berhasil discan!', type: 'success' });
            } else {
              setKtpData(null); // Kosongkan datazz jika NIK tidak valid
              setScanMessage({ text: 'KTP kurang jelas atau NIK tidak valid (harus 16 digit).', type: 'error' });
            }
          } else {
            setKtpData(null);
            setScanMessage({ text: 'Scan KTP Gagal: Tidak ada data yang ditemukan.', type: 'error' });
          }
        } catch (error) {
          console.error("Error scanning KTP:", error);
          setKtpData(null);
          setScanMessage({ text: 'Terjadi kesalahan saat memproses gambar.', type: 'error' });
        } finally {
          setIsLoading(false); // Selesai loading
        }
      }
    };

    processImage();
  }, [capturedImage]);

  // --- Fungsi parsing KTP yang sudah diperbaiki ---
  // Pastikan Anda menggunakan versi terakhir dari fungsi parseKtpData di sini.
  // Saya menyertakan kembali untuk kelengkapan kode.
  const parseKtpData = (dataArray: string[]): KtpData => {
    const parsed: Partial<KtpData> = {};
    let alamatParts: string[] = [];
    let collectingAlamat = false;

    const cleanValue = (value: string): string => {
      return value.replace(/\s+/g, ' ').replace(/[:=\-.,#]/g, '').trim();
    };

    const getValue = (startIndex: number, keyword: string, skipNextIfEmptyColon: boolean = false): { value: string; newIndex: number } => {
      let currentItem = dataArray[startIndex]?.trim() ?? "";
      let value = "";
      let newIndex = startIndex;

      const normalizedKeyword = keyword
        .replace(/Tempat\/Tgl Lahir/i, "Tempat/Tgl Lahir")
        .replace(/Jenis kelamin/i, "Jenis kelamin")
        .replace(/Gol\. Darah/i, "Gol. Darah")
        .replace(/Berlaku Hingga/i, "Berlaku Hingga");

      const keywordRegex = new RegExp(`^${normalizedKeyword}\\s*[:=\\-#]?\\s*(.*)`, 'i');
      const match = currentItem.match(keywordRegex);

      if (match && match[1]) {
        value = cleanValue(match[1]);
      }

      if (!value || (skipNextIfEmptyColon && value === "")) {
        let tempIndex = startIndex + 1;
        while (tempIndex < dataArray.length) {
          let nextLine = dataArray[tempIndex].trim();
          if (!nextLine || nextLine === ":" || nextLine === "-" || nextLine.toLowerCase().includes("love") || nextLine.toLowerCase().includes("all") || nextLine.match(/^\d{2}-\d{2}-\d{4}$/)) {
            tempIndex++;
            continue;
          }
          if (nextLine.includes("PROVINSI") || nextLine.includes("KABUPATEN") || nextLine.includes("NIK") ||
              nextLine.includes("Nama") || nextLine.includes("Tempat/Tgl Lahir") || nextLine.includes("Jenis kelamin") ||
              nextLine.includes("Gol. Darah") || nextLine.includes("Alamat") || nextLine.includes("RT/RW") ||
              nextLine.includes("Kel/Desa") || nextLine.includes("Kecamatan") || nextLine.includes("Agama") ||
              nextLine.includes("Status Perkawinan") || nextLine.includes("Pekerjaan") ||
              nextLine.includes("Kewarganegaraan") || nextLine.toLowerCase().includes("berlaku hingga")) {
              break;
          }

          value = cleanValue(nextLine);
          newIndex = tempIndex;
          break;
        }
      }
      return { value, newIndex };
    };


    for (let i = 0; i < dataArray.length; i++) {
      let item = dataArray[i].trim();

      item = item.replace(/Gel\. Darah/i, 'Gol. Darah');
      item = item.replace(/Perkawinarc/i, 'Perkawinan');
      item = item.replace(/Beriaku Hingga/i, 'Berlaku Hingga');


      if (!item || item === ":" || item === "-" || item.toLowerCase().includes("love") || item.toLowerCase().includes("all") || item.match(/^\d{2}-\d{2}-\d{4}$/)) {
          continue;
      }

      if (item.includes("PROVINSI")) {
        parsed.provinsi = getValue(i, "PROVINSI").value;
      } else if (item.includes("KABUPATEN") && !item.includes("Status Perkawinan")) {
        parsed.kabupaten = getValue(i, "KABUPATEN").value;
      } else if (item === "NIK" || item.includes("NIK")) {
        const { value, newIndex } = getValue(i, "NIK", true);
        parsed.nik = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Nama")) {
        const { value, newIndex } = getValue(i, "Nama", true);
        parsed.nama = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Tempat/Tgl Lahir")) {
        const { value, newIndex } = getValue(i, "Tempat/Tgl Lahir", true);
        parsed.tempatTglLahir = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Jenis kelamin")) {
        const { value, newIndex } = getValue(i, "Jenis kelamin", true);
        parsed.jenisKelamin = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Gol. Darah")) {
        const { value, newIndex } = getValue(i, "Gol. Darah", true);
        parsed.golDarah = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Alamat")) {
        collectingAlamat = true;
        const { value, newIndex } = getValue(i, "Alamat", true);
        if (value) {
          alamatParts.push(value);
          if (newIndex > i) i = newIndex;
        }
      } else if (item.includes("RT/RW")) {
        const { value, newIndex } = getValue(i, "RT/RW", true);
        parsed.rtRw = value;
        if (newIndex > i) i = newIndex;
        collectingAlamat = false;
      } else if (item.includes("Kel/Desa")) {
        const { value, newIndex } = getValue(i, "Kel/Desa", true);
        parsed.kelDesa = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Kecamatan")) {
        const { value, newIndex } = getValue(i, "Kecamatan", true);
        parsed.kecamatan = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Agama")) {
        const { value, newIndex } = getValue(i, "Agama", true);
        parsed.agama = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Status Perkawinan")) {
        const { value, newIndex } = getValue(i, "Status Perkawinan", true);
        parsed.statusPerkawinan = value;
        if (newIndex > i) i = newIndex;
      } else if (item.includes("Pekerjaan")) {
        const { value, newIndex } = getValue(i, "Pekerjaan", true);
        parsed.pekerjaan = value;
        if (newIndex > i) i = newIndex;
      } else if (item.toLowerCase().includes("kewarganegaraan")) {
        const { value, newIndex } = getValue(i, "Kewarganegaraan", true);
        parsed.kewarganegaraan = value;
        if (newIndex > i) i = newIndex;
      } else if (item.toLowerCase().includes("berlaku hingga")) {
        const { value, newIndex } = getValue(i, "Berlaku Hingga", true);
        parsed.berlakuHingga = value || "SEUMUR HIDUP";
        if (newIndex > i) i = newIndex;
      }
      else if (collectingAlamat) {
        const isKeywordOrNoise =
          item.includes("RT/RW") || item.includes("Kel/Desa") || item.includes("Kecamatan") ||
          item.includes("Agama") || item.includes("Status Perkawinan") ||
          item.includes("Pekerjaan") || item.includes("Kewarganegaraan") ||
          item.toLowerCase().includes("berlaku hingga") ||
          item.toLowerCase().includes("bojonegoro") ||
          item.toLowerCase().includes("magetan") ||
          item.match(/^\d{2}-\d{2}-\d{4}$/) ||
          item.match(/^[.:=]/) ||
          item.length < 3;
  
        if (!isKeywordOrNoise) {
          alamatParts.push(cleanValue(item));
        }
      }
    }
  
    if (alamatParts.length > 0) {
      parsed.alamat = alamatParts.join(" ").trim();
    } else {
        parsed.alamat = "";
    }
  
    return {
      provinsi: parsed.provinsi || "",
      kabupaten: parsed.kabupaten || "",
      nik: parsed.nik || "",
      nama: parsed.nama || "",
      tempatTglLahir: parsed.tempatTglLahir || "",
      jenisKelamin: parsed.jenisKelamin || "",
      golDarah: parsed.golDarah || "",
      alamat: parsed.alamat || "",
      rtRw: parsed.rtRw || "",
      kelDesa: parsed.kelDesa || "",
      kecamatan: parsed.kecamatan || "",
      agama: parsed.agama || "",
      statusPerkawinan: parsed.statusPerkawinan || "",
      pekerjaan: parsed.pekerjaan || "",
      kewarganegaraan: parsed.kewarganegaraan || "",
      berlakuHingga: parsed.berlakuHingga || "",
    };
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          title: "Ambil Gambar",
          headerStyle: { backgroundColor: "#115f9f" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <CustomHeader title="Profile" />
      <Image source={require("../../assets/images/ktp.png")} style={styles.image} />
      <Text style={styles.instructions}>
        Ambil gambar KTP untuk menampilkan data terstruktur.
      </Text>

      <TouchableOpacity style={styles.pickButton} onPress={handlePickImage}>
        <Text style={styles.pickButtonText}>Ambil Gambar KTP</Text>
      </TouchableOpacity>

      {capturedImage && (
        <View style={styles.imageContainer}>
          <Text style={styles.headerText}>Gambar KTP:</Text>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        </View>
      )}

      {/* Area pesan scan */}
      {scanMessage.type && (
        <View style={[
          styles.scanMessageContainer,
          scanMessage.type === 'success' ? styles.scanMessageSuccess : styles.scanMessageError
        ]}>
          <Text style={styles.scanMessageText}>{scanMessage.text}</Text>
        </View>
      )}

      {isLoading ? (
        <SkeletonLoading />
      ) : (
        ktpData && (
          <View style={styles.dataCard}>
            <Text style={styles.cardTitle}>Detail KTP</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Provinsi:</Text>
              <Text style={styles.dataValue}>{ktpData.provinsi}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Kabupaten:</Text>
              <Text style={styles.dataValue}>{ktpData.kabupaten}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>NIK:</Text>
              <Text style={styles.dataValue}>{ktpData.nik}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nama:</Text>
              <Text style={styles.dataValue}>{ktpData.nama}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Tempat/Tgl Lahir:</Text>
              <Text style={styles.dataValue}>{ktpData.tempatTglLahir}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Jenis Kelamin:</Text>
              <Text style={styles.dataValue}>{ktpData.jenisKelamin}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Gol. Darah:</Text>
              <Text style={styles.dataValue}>{ktpData.golDarah || '-'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Alamat:</Text>
              <Text style={styles.dataValue}>{ktpData.alamat}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>RT/RW:</Text>
              <Text style={styles.dataValue}>{ktpData.rtRw}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Kel/Desa:</Text>
              <Text style={styles.dataValue}>{ktpData.kelDesa}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Kecamatan:</Text>
              <Text style={styles.dataValue}>{ktpData.kecamatan}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Agama:</Text>
              <Text style={styles.dataValue}>{ktpData.agama}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Status Perkawinan:</Text>
              <Text style={styles.dataValue}>{ktpData.statusPerkawinan}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Pekerjaan:</Text>
              <Text style={styles.dataValue}>{ktpData.pekerjaan}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Kewarganegaraan:</Text>
              <Text style={styles.dataValue}>{ktpData.kewarganegaraan}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Berlaku Hingga:</Text>
              <Text style={styles.dataValue}>{ktpData.berlakuHingga}</Text>
            </View>
            <TouchableOpacity onPress={()=>{
              alert("oke")
            }}>
              <Text>Upload Ktp</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 30,
    backgroundColor: "#fff",
    padding: 16,
  },
  instructions: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  pickButton: {
    backgroundColor: "#115f9f",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  imageContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  capturedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    resizeMode: "contain",
  },
  // --- Skeleton Loading Styles ---
  skeletonContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  skeletonLineShort: {
    width: '50%',
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonLineMedium: {
    width: '75%',
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonLineLong: {
    width: '90%',
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  // --- Scan Message Styles ---
  scanMessageContainer: {
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanMessageSuccess: {
    backgroundColor: '#d4edda', // Hijau muda
    borderColor: '#28a745',
    borderWidth: 1,
  },
  scanMessageError: {
    backgroundColor: '#f8d7da', // Merah muda
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  scanMessageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  // --- Existing Data Card Styles ---
  dataCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#115f9f",
    marginBottom: 15,
    textAlign: "center",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dataLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    fontWeight: "500",
  },
  dataValue: {
    fontSize: 14,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  image:{
    width: 1000,
    height: 300,
    alignSelf: "center",
    marginBottom: 20,
    resizeMode: "contain",
  }
});

export default DisplayCapturedImage;