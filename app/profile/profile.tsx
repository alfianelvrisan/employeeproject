import { HelloWave } from '@/components/HelloWave';
import React from 'react';
import {StyleSheet, Text, ScrollView, StatusBar} from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

const App = () => (
  <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }}>
         <Text style={styles.background}></Text>
         <Text style={styles.name}>
                   Good Morning,<Text style={styles.names}> Eki Prastyan</Text>
                   <HelloWave />
                 </Text>
      </ScrollView>
    </SafeAreaView>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1, // Ensure ScrollView fills the container
  },
  text: {
    fontSize: 42,
    padding: 12,
  },
  name: {
    marginLeft: 20,
    color: '#115f9f',
    top: 11,
    zIndex: 2,
  },
  background: {
    backgroundColor: '#c3eaff',
    width: '100%',
    height: 110,
    position: 'absolute',
  },
});

export default App;