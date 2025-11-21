import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
  Text,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const KeyboardAvoidingComponent = () => {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={20} // Adjust this value to match the height of your navbar
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Search Bar with Icon */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search something..."
              placeholderTextColor="#aaa"
            />
            <Ionicons
              name="search-outline"
              size={20}
              color="#aaa"
              style={styles.searchIcon}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: '2%',
    height: 40,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    top: 190,
    elevation: 3,
  },
  searchBar: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginLeft: 10,
  },
});

export default KeyboardAvoidingComponent;