import { ImageBackground, Text, View,StyleSheet } from 'react-native'
import React, { Component } from 'react'


const imagebackground = require('../../assets/images/background_img.png');

export default class cardhome extends Component {
  render() {
    return (
      <View>
         <ImageBackground
          source={imagebackground} // Gambar latar belakang untuk card
          style={styles.card}
          imageStyle={styles.cardImage} // Opsional: untuk styling gambar
        >
          <Text style={styles.textSaving}>Saving</Text>
          <Text style={styles.textLeft}>
            Rp 4.000.000
          </Text>
          <View style={styles.horizontalLine}></View>
          <Text style={styles.textPointLabel}>Point</Text>
          <Text style={styles.textPointValue}>100.000</Text>
          <Text style={styles.rankMember}>Rank 1 from 26.738 others</Text>
        </ImageBackground>
      </View>
    )
  }
}


const styles = StyleSheet.create({
      card: {
        backgroundColor: '#228bdd',
        width: '96%',
        height: 150,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'absolute',
        top: '100%',
        marginHorizontal: '2%',
        transform: [{ translateY: -75 }], 
        overflow: 'hidden',
        top:95,
      },
      textSaving: {
        alignSelf: 'flex-start',
        marginLeft: 20,
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 1,
      },
      textLeft: {
        alignSelf: 'flex-start',
        marginLeft: 20,
        fontSize: 23,
        fontWeight: 'bold',
        color: '#fff',
      },
      horizontalLine: {
        alignSelf: 'stretch',
        height: 1,
        backgroundColor: '#fff',
        marginVertical: 5, 
        marginHorizontal: 20,
      },
      textPointLabel: {
        alignSelf: 'flex-start',
        marginLeft: 20,
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        marginTop: 1,
      },
      textPointValue: {
        alignSelf: 'flex-start',
        marginLeft: 20,
        fontSize: 23,
        fontWeight: 'bold',
        color: '#fff',
      },
      breakline:{
        height:10,
        width: '100%'
      },
      rankMember:{
        alignSelf: 'flex-end',
        marginRight: 20,
        fontSize: 12,
        fontWeight: '300',
        color: '#fff',
        marginTop: 1,
      },
      name :{
        marginLeft: 20,
        color: '#115f9f',
      },
      names:{
        fontWeight: 'bold',
      }
})