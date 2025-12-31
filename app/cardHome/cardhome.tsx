import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchProfile } from '../../services/profileServices';
import { FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = width * 0.38; // Responsive aspect ratio
const IS_COMPACT = width <= 360;
const CARD_PADDING_HORIZONTAL = IS_COMPACT ? 14 : 18;
const CARD_PADDING_VERTICAL = IS_COMPACT ? 12 : 16;
const LABEL_FONT_SIZE = IS_COMPACT ? 12 : 14;
const VALUE_FONT_SIZE = IS_COMPACT ? 22 : 26;
const RANK_FONT_SIZE = IS_COMPACT ? 12 : 13;
const DIVIDER_MARGIN_VERTICAL = IS_COMPACT ? 8 : 12;

export default function cardhome() {
  const { userToken } = useAuth();
  const { logout } = useAuth();
  const [profil, setProfile] = React.useState<{
    id: number,
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
          if (profile === undefined) {
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
              <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                Saving
              </Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                Rp {profil?.saving || '0'}
              </Text>
            </View>
            <View style={styles.block}>
              <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                Point
              </Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                {profil?.poin || '0'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.rankMember} numberOfLines={1} ellipsizeMode="tail">
            Rank {profil?.ranking || '0'} dari {profil?.total || '0'} member
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffe600ff',
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    marginHorizontal: 0,
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
    paddingHorizontal: CARD_PADDING_HORIZONTAL,
    paddingVertical: CARD_PADDING_VERTICAL,
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
    fontSize: LABEL_FONT_SIZE,
    color: '#e7f2ff',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  value: {
    fontSize: 23,
    fontFamily: FONTS.bold,
    color: '#ffffffff',
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: DIVIDER_MARGIN_VERTICAL,
  },
  rankMember: {
    fontSize: RANK_FONT_SIZE,
    color: '#e7f2ff',
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
})
