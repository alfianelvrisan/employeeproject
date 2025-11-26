import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchProfile } from '../../services/profileServices';

export default function cardhome() {
  const { userToken } = useAuth();
  const {logout}=useAuth();
  const [profil, setProfile] = React.useState<{
    id:number,
    nama: string;
    saving: number;
    poin: number;
    ranking: number;
    total: number;
  } | null>(null);

  const Image = require('../../assets/images/bg_card_home_update2.jpg');

 

  useEffect(() => {
    if (userToken) {
      fetchProfile(userToken)
        .then((profile) => {
          setProfile(profile);
          if(profile===undefined){
            logout()
          }
        })
        .catch((error) => {
        });
    }
  }, [userToken]);
  

  return (
    <View>
      <ImageBackground
        source={Image}
        style={styles.card}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.row}>
            <View style={styles.block}>
              <Text style={styles.label}>Saving</Text>
              <Text style={styles.value}>Rp {profil?.saving || '0'}</Text>
            </View>
            <View style={styles.block}>
              <Text style={styles.label}>Point</Text>
              <Text style={styles.value}>{profil?.poin || '0'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.rankMember}>
            Rank {profil?.ranking || '0'} dari {profil?.total || '0'} member
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#115f9f',
    width: '96%',
    height: 160,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    marginHorizontal: '2%',
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 16,
  },
  overlay: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  block: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#e7f2ff',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: 12,
  },
  rankMember: {
    fontSize: 13,
    color: '#e7f2ff',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
