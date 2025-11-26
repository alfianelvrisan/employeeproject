import { AuthProvider } from "../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { StyleSheet, Text, ScrollView, View, Image, Switch } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import CustomHeader from "../../../components/CustomHeader";
import React from "react";

const App = () => {

  return (
    <AuthProvider>
      <SafeAreaProvider>
      <Stack.Screen
                options={{
                  headerShown: false,
                  headerTitle: "Notifikasi",
                  headerTitleAlign: "center",
                  headerStyle: {
                    backgroundColor: "#fff",
                  },
                  headerTintColor: "#115f9f",
                }}
              />
        <SafeAreaView style={styles.container}>
          <CustomHeader title="Syarat Ketentuan"/>
          <ScrollView style={styles.container}>
        <Text style={styles.title}>Syarat dan Ketentuan Ember Laskar Buah Indonesia</Text>
        <Text style={styles.paragraph}>
          1. Poin didapatkan dengan setiap pembelian senilai Rp 1.000, pelanggan akan mendapatkan 1 poin.
        </Text>
        <Text style={styles.paragraph}>
          2. Saving didapatkan dari pembulatan recehan pelanggan. Contoh: jika harga total adalah Rp 12.400 dan pelanggan membayar Rp 13.000, maka Rp 100 akan masuk ke saving, dan Rp 500 menjadi kembalian.
        </Text>
        <Text style={styles.paragraph}>
          3. Poin yang terkumpul dapat digunakan untuk mendapatkan diskon atau hadiah tertentu sesuai dengan ketentuan yang berlaku.
        </Text>
        <Text style={styles.paragraph}>
          4. Saving yang terkumpul dapat digunakan untuk pembayaran sebagian atau seluruh transaksi di masa mendatang.
        </Text>
        <Text style={styles.paragraph}>
          5. Poin dan saving tidak dapat diuangkan atau ditransfer ke akun lain.
        </Text>
        <Text style={styles.paragraph}>
          6. Pelanggan wajib menunjukkan kartu anggota atau aplikasi untuk mendapatkan poin dan saving.
        </Text>
        <Text style={styles.paragraph}>
          7. Poin dan saving akan hangus jika akun pelanggan tidak aktif selama 12 bulan berturut-turut.
        </Text>
        <Text style={styles.paragraph}>
          8. Ember Laskar Buah Indonesia berhak mengubah syarat dan ketentuan ini tanpa pemberitahuan sebelumnya.
        </Text>
        <Text style={styles.paragraph}>
          9. Poin dan saving hanya berlaku untuk transaksi yang dilakukan di toko resmi Laskar Buah Indonesia.
        </Text>
        <Text style={styles.paragraph}>
          10. Pelanggan bertanggung jawab untuk menjaga kerahasiaan akun dan informasi pribadi mereka.
        </Text>
        <Text style={styles.paragraph}>
          11. Poin dan saving tidak berlaku untuk pembelian produk tertentu yang ditentukan oleh Laskar Buah Indonesia.
        </Text>
        <Text style={styles.paragraph}>
          12. Pelanggan dapat memeriksa saldo poin dan saving mereka melalui aplikasi atau website resmi Laskar Buah Indonesia.
        </Text>
        <Text style={styles.paragraph}>
          13. Poin dan saving tidak dapat digabungkan dengan promosi atau diskon lainnya kecuali dinyatakan sebaliknya.
        </Text>
        <Text style={styles.paragraph}>
          14. Pelanggan yang melanggar syarat dan ketentuan ini dapat kehilangan hak atas poin dan saving mereka.
        </Text>
        <Text style={styles.paragraph}>
          15. Laskar Buah Indonesia tidak bertanggung jawab atas kehilangan poin atau saving akibat kesalahan pelanggan.
        </Text>
        <Text style={styles.paragraph}>
          16. Poin dan saving hanya berlaku untuk transaksi ritel dan tidak berlaku untuk pembelian grosir.
        </Text>
        <Text style={styles.paragraph}>
          17. Pelanggan wajib memeriksa struk pembelian untuk memastikan poin dan saving telah ditambahkan dengan benar.
        </Text>
        <Text style={styles.paragraph}>
          18. Laskar Buah Indonesia berhak menangguhkan atau membatalkan akun pelanggan yang terindikasi melakukan kecurangan.
        </Text>
        <Text style={styles.paragraph}>
          19. Poin dan saving tidak berlaku untuk transaksi yang dibatalkan atau dikembalikan.
        </Text>
        <Text style={styles.paragraph}>
          20. Dengan menggunakan layanan ini, pelanggan dianggap telah menyetujui semua syarat dan ketentuan yang berlaku.
        </Text>
      </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    padding: 20,
    paddingTop: 20, // Move profile section further down
  },
  headerCard: {
    alignItems: "center",
    marginBottom: 30, // Add more space below the profile header
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#115f9f",
  },
  profileGreeting: {
    fontSize: 14,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressContainer: {
    alignItems: "flex-start", // Align items to the top for multiline text
  },
  icon: {
    color: "#115f9f",
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: "#555",
    textAlign: "right",
    flex: 2, // Allow the text to take more space
  },
  wrapText: {
    flexWrap: "wrap", // Ensure text wraps to the next line
  },
  paragraph :{
    padding:10
  },
  title:{
    fontSize: 20,
    fontWeight: 'bold',
    color: '#115f9f',
    textAlign: 'center',
    marginBottom: 20,
  }
});

export default App;
