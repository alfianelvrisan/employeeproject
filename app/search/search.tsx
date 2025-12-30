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
                    <Ionicons name="arrow-back" size={24} color={PRIMARY_TEXT_DARK} />
                </TouchableOpacity>
                <View style={styles.searchBarWrapper}>
                    <Ionicons name="search-outline" size={20} color={PRIMARY_TEXT_MUTED} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari produk favoritmu..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#ccc" />
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        backgroundColor: "#ffffff",
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    searchBarWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        height: "100%",
    },
    content: {
        flex: 1,
    },
});
