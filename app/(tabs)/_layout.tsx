import React from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Text,
} from 'react-native';
import { CurvedBottomBarExpo } from 'react-native-curved-bottom-bar';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Index from './index';
import Explore from './explore';
import Profile from '../profile/profile';
import Notif from '../notification/notification';
import Cards from '../card/card';


const Home = () => {
  return <View>
    <Text><Index/>
    </Text>
  </View>
};

const Screen2 = () => {
  return <View style={styles.screen2}>
    <Text><Explore/></Text>
  </View>
};
const Profiles = () => {
  return <View>
    <Text><Profile/></Text>
  </View>
};

const Notification = () => {
  return <View>
    <Text><Notif/></Text>
  </View>
}
const Cart = () => {
  return <View>
    <Text><Cards/></Text>
  </View>
}
const HeaderRightComponent = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
      <Ionicons
        name="notifications-outline"
        size={24}
        color="white"
        style={{ marginRight: 15 }}
      />
      <Text style={styles.notifalert}>13</Text>
    </TouchableOpacity>
  );
};
export default function App() {
  const _renderIcon = (routeName, selectedTab) => {
    let icon = '';

    switch (routeName) {
      case 'Home':
        icon = 'home';
        break;
      case 'Settings':
        icon = 'gift';
        break;
      case 'Profiles':
        icon = 'person';
        break;
      case 'Notifi':
        icon = 'notifications-outline';
        break;
      case 'Barcode':
      icon = 'qr-code-outline';
      break;
      case 'Cart':
      icon = 'cart';
      break;
    }

    return (
      <Ionicons
        name={icon}
        size={25}
        color={routeName === selectedTab ? '#115f9f' : 'gray'}
      />
    );
  };
  const renderTabBar = ({ routeName, selectedTab, navigate }) => {
    return (
      <TouchableOpacity
        onPress={() => navigate(routeName)}
        style={styles.tabbarItem}
      >
        {_renderIcon(routeName, selectedTab)}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <CurvedBottomBarExpo.Navigator
  type="DOWN"
  style={[styles.bottomBar, styles.shadow]}
  shadowStyle={styles.shadow}
  height={55}
  circleWidth={50}
  bgColor="white" 
  initialRouteName="Home"
  // borderTopLeftRight={true}
  renderCircle={({ selectedTab, navigate }) => (
    <View style={styles.btnCircleUp}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Alert.alert('Click Action')}
      >
        <Ionicons name={'qr-code-outline'} color="#115f9f" size={25} />
      </TouchableOpacity>
    </View>
  )}
  tabBar={renderTabBar}
>
  <CurvedBottomBarExpo.Screen
    name="Home"
    position="LEFT"
    component={() => <Home/>}
    options={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#c3eaff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#fff',
      headerTitle: () => (
        <Image
          source={require('@/assets/images/logo1.png')}
          style={{ width: 150, resizeMode: 'contain' }}
        />
      ),
      headerRight:() => <HeaderRightComponent />
    }}
  />
  <CurvedBottomBarExpo.Screen
    name="Settings"
    position="RIGHT"
    component={() => <Screen2 />}
    options={{
      headerShown: false,
    }}
  />
  <CurvedBottomBarExpo.Screen
    name="Cart"
    position="LEFT"
    component={() => <Cards />}
    options={{
      headerShown: false,
    }}
  />
  <CurvedBottomBarExpo.Screen
    name="Profiles"
    position="RIGHT"
    component={() => <Profiles />}
    options={{
      headerShown: false,
    }}
  />
</CurvedBottomBarExpo.Navigator>
    </>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  shawdow: {
    shadowColor: '#000', // Warna shadow
    shadowOffset: { width: 0, height: -2 }, // Posisi shadow
    shadowOpacity: 0.1, // Transparansi shadow
    shadowRadius: 4, // Radius blur shadow
    elevation: 5,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomBar: {
    bottom: 0,
    // zIndex: 1000,
    // position: 'fixed',
  },
  btnCircleUp: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c3eaff',
    bottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 3,
  },
  imgCircle: {
    width: 30,
    height: 30,
    tintColor: 'gray',
  },
  tabbarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: 30,
    height: 30,
  },
  screen1: {
    flex: 1,
    backgroundColor: '#4287f5',
  },
  screen2: {
    flex: 1,
    backgroundColor: '#FFEBCD',
  },
  notifalert : {
    position:'absolute',
    width:15,
    height:15,
    backgroundColor:'#115f9f',
    borderRadius:100,
    fontSize:9,
    color:'#fff',
    marginHorizontal:'auto',
    textAlign:'center',
    fontWeight:'bold',
  }
});