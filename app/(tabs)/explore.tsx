import { router } from 'expo-router'
import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export default class explore extends Component {
  render() {
    return (
      <View>
        <TouchableOpacity onPress={() => router.push('/test')} style={{marginTop:50}}>
          <Text>Explore</Text>
        </TouchableOpacity>
      </View>
    )
  }
}
