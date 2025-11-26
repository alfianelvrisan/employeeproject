import React, { Component } from 'react'
import { Text, StyleSheet, View } from 'react-native'

export default class footerpay extends Component {
  render() {
    return (
      <View>
        <Text style={styles.container}> hallo </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginTop: 100,
  },
  text: {
    fontSize: 100,
    fontWeight: 'bold',
    color: '#333',
  },
})
