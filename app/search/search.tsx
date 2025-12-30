import React, { useState, useEffect } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Platform,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Produk from "../produk/produk";

const PRIMARY_YELLOW = "#FFF247";
const PRIMARY_TEXT_DARK = "#3a2f00";
const PRIMARY_TEXT_MUTED = "#de0866";

export default function SearchPage() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const idStore = params.idStore || "";
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back-circle-outline" size={32} color={PRIMARY_TEXT_DARK} />
                </TouchableOpacity>
                <View style={styles.searchBarWrapper}>
                    <Ionicons name="search" size={20} color={PRIMARY_TEXT_MUTED} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari produk favoritmu..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        selectionColor={PRIMARY_TEXT_MUTED}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#e5e7eb" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.content}>
                <Produk
                    idStore={idStore}
                    searchQuery={searchQuery}
                    showSearchBar={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#ffffff",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        zIndex: 10,
    },
    backButton: {
        padding: 0,
    },
    searchBarWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fffdf0", // Very light yellow tint
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 46,
        borderWidth: 1,
        borderColor: "#fff247", // Primary Yellow border
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: PRIMARY_TEXT_DARK,
        height: "100%",
        fontWeight: "500",
    },
    content: {
        flex: 1,
    },
});
