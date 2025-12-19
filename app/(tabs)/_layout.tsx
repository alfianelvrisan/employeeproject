import React from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Text,
  Button,
} from "react-native";
import { CurvedBottomBarExpo } from "react-native-curved-bottom-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import Index from "./index";
import Explore from "./explore";
import Profile from "../profile/profile";
import Carts from "../cart/cart";
import { router, Stack, useRouter } from "expo-router";
import { AuthProvider } from "../../context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import Gift from "../gift/Gift";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const Home = () => {
  return <Index />;
};

const giftcard = () => {
  return (
    <View style={styles.screen2}>
        <Gift />
    </View>
  );
};
const Profiles = () => {
  return (
  <Profile />
 );
};
const Cart = () => {
  return (
    <View>
        <Carts />
    </View>
  );
};
const HeaderRightComponent = () => {
  return (
    <TouchableOpacity
      onPress={() => router.push("/notification/notification")}
      style={{ marginRight: 15 }}
    >
      <View style={{ position: "relative" }}>
        <Ionicons name="notifications-outline" size={24} color="white" />
        <View style={styles.notifBadge}>
          <Text style={styles.notifText}>13</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
export default function App() {
  const _renderIcon = (routeName: any, selectedTab: any) => {
    let icon = "";
  
    switch (routeName) {
      case "Home":
        icon = routeName === selectedTab ? "home" : "home-outline";
        break;
      case "Settings":
        icon = routeName === selectedTab ? "play-circle" : "play-circle-outline";
        break;
      case "Profiles":
        icon = routeName === selectedTab ? "person" : "person-outline";
        break;
      case "Notifi":
        icon = routeName === selectedTab ? "notifications" : "notifications-outline";
        break;
      case "Barcode":
        icon = "qr-code"; // Tidak ada "qr-code-outline" di Ionicons
        break;
      case "Cart":
        icon = routeName === selectedTab ? "cart" : "cart-outline";
        break;
    }
  
    const isActive = routeName === selectedTab;

    return (
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={26}
        color={isActive ? "#3b2b00" : "#b09c4a"}
      />
    );
  };
  const renderTabBar = ({ routeName, selectedTab, navigate }) => {
    const handlePress = () => {
      if (routeName === "Settings") {
        router.push("/gift/Gift");
      } else {
        navigate(routeName);
      }
    };
    const isActive = selectedTab === routeName;
    return (
      <TouchableOpacity
      onPress={handlePress}
        style={[styles.tabbarItem, isActive && styles.tabbarItemActive]}
      >
        <View style={[styles.iconChip, isActive && styles.iconChipActive]}>
          {_renderIcon(routeName, selectedTab)}
        </View>
      </TouchableOpacity>
    );
  };
const insets = useSafeAreaInsets(); 


  return (
    <>
    <AuthProvider>
      <CurvedBottomBarExpo.Navigator
        type="DOWN"
        style={[styles.bottomBar, { paddingBottom: insets.bottom }]}
        shadowStyle={styles.shadow}
        height={55}
        circleWidth={50}
        bgColor="#ffffffff"
        initialRouteName="Home"
        id="mainNavigator"
        screenOptions={{ headerShown: false }}
        borderColor="transparent"
        borderWidth={0}
        renderCircle={({  }) => (
          <View style={styles.btnCircleUp}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/scan/scanqrcode")}
            >
              <MaterialIcons name={"qr-code-scanner"} color="#4a3600" size={25} />
            </TouchableOpacity>
          </View>
        )}
        tabBar={renderTabBar}
      >
        <CurvedBottomBarExpo.Screen
          name="Home"
          position="LEFT"
          component={Index}
          options={{
            headerShown: false,
          }}
        />
        <CurvedBottomBarExpo.Screen
          name="Settings"
          position="RIGHT"
          component={()=> <Gift />}
          options={{
            headerShown: true,
            headerTitle: "GiftLbi",
            headerTitleAlign: "center",
            headerStyle: {
              elevation: 0, 
              shadowOpacity: 0, 
            },
            headerTintColor: "#115f9f",
          }}
        />
        <CurvedBottomBarExpo.Screen
          name="Cart"
          position="LEFT"
          component={() => <Carts />}
          options={{  
            headerShown: true,
            headerTitle: "Pesanan",
            headerTitleAlign: "center",
            headerStyle: {
              elevation: 0, 
              shadowOpacity: 0, 
            },
            headerTintColor: "#115f9f",
          }}
        />
        <CurvedBottomBarExpo.Screen
          name="Profiles"
          position="RIGHT"
          component={() => <Profiles />}
          options={{
            headerShown: false,
            headerStyle: {
              backgroundColor: "#fff",
            },
          }}
          
        />
        
      </CurvedBottomBarExpo.Navigator>
      </AuthProvider>
    </>
  );
}





export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  shadow: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  button: {
    flex: 1,
    justifyContent: "center",
  },
  bottomBar: {
    bottom: 0,
    elevation: 0,
  },
  btnCircleUp: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffe133",
    bottom: 30,
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  imgCircle: {
    width: 30,
    height: 30,
    tintColor: "gray",
  },
  tabbarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabbarItemActive: {
    transform: [{ translateY: -6 }],
  },
  iconChip: {
    width: 48,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconChipActive: {
    backgroundColor: "#fff6da",
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  img: {
    width: 30,
    height: 30,
  },
  screen1: {
    flex: 1,
    backgroundColor: "#4287f5",
  },
  screen2: {
    flex: 1,
    backgroundColor: "#FFEBCD",
  },
  notifBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notifText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  textnotif : {
    color: "#115f9f",
    fontSize: 18,
    fontWeight: "medium",
    marginRight: 20,
  }
});
