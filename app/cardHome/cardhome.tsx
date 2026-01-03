import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FONTS } from '../../constants/theme';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getTopupSavingsByMember } from '../../services/topupSavings';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = width * 0.38; // Responsive aspect ratio
const IS_COMPACT = width <= 360;
const CARD_PADDING_HORIZONTAL = IS_COMPACT ? 14 : 18;
const CARD_PADDING_VERTICAL = IS_COMPACT ? 12 : 16;
const LABEL_FONT_SIZE = IS_COMPACT ? 12 : 14;
const VALUE_FONT_SIZE = IS_COMPACT ? 22 : 26;
const RANK_FONT_SIZE = IS_COMPACT ? 12 : 13;
const DIVIDER_MARGIN_VERTICAL = IS_COMPACT ? 8 : 12;
const SHEET_HEIGHT = Math.round(CARD_HEIGHT + 220);

export default function cardhome() {
  const { userToken, fetchProfile } = useAuth();
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [profil, setProfile] = React.useState<{
    id: number,
    nama: string;
    saving: number;
    poin: number;
    ranking: number;
    total: number;
  } | null>(null);
  const [hasPendingTopup, setHasPendingTopup] = useState(false);

  const Image = require('../../assets/images/bg_card_home_update2.jpg');

  const openSheet = () => {
    setSheetVisible(true);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetTranslateY, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          sheetTranslateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80 || gesture.vy > 0.8) {
          closeSheet();
        } else {
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;


  useEffect(() => {
    if (userToken) {
      fetchProfile()
        .then((profile) => {
          if (profile) {
            setProfile(profile);
          }
        })
        .catch((error) => {
          console.warn((error as Error).message);
        });
    }
  }, [userToken]);

  useFocusEffect(
    React.useCallback(() => {
      if (!userToken) return;
      fetchProfile()
        .then((profile) => {
          if (profile) {
            setProfile(profile);
          }
          if (profile?.id) {
            getTopupSavingsByMember(profile.id, userToken)
              .then((res) => {
                const list = Array.isArray(res) ? res : res?.data || [res];
                const pending = (Array.isArray(list) ? list : []).some(
                  (item) =>
                    String(item?.status || "").toUpperCase() === "PENDING"
                );
                setHasPendingTopup(pending);
              })
              .catch(() => {
                setHasPendingTopup(false);
              });
          }
        })
        .catch((error) => {
          console.warn((error as Error).message);
        });
    }, [userToken])
  );

  const renderCardContent = () => (
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
  );


  return (
    <View>
      <TouchableOpacity activeOpacity={0.9} onPress={openSheet}>
        {renderCardContent()}
      </TouchableOpacity>
      <Modal transparent visible={sheetVisible} animationType="none">
        <Pressable style={styles.sheetOverlay} onPress={closeSheet} />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetCardWrap}>{renderCardContent()}</View>
          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[
                styles.primaryAction,
                styles.halfAction,
                hasPendingTopup && styles.actionDisabled,
              ]}
              onPress={() => {
                if (hasPendingTopup) return;
                closeSheet();
                router.push("/topup/TopupSavings");
              }}
              disabled={hasPendingTopup}
            >
              <Text style={styles.primaryActionText}>Top Up Saving</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryAction, styles.halfAction]}
              onPress={() => {
                closeSheet();
                router.push("/topup/TopupHistory");
              }}
            >
              <Text style={styles.secondaryActionText}>History</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
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
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d7d7d7',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetCardWrap: {
    paddingBottom: 16,
  },
  sheetActions: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 10,
  },
  halfAction: {
    flex: 1,
  },
  primaryAction: {
    backgroundColor: '#e21864',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  secondaryAction: {
    backgroundColor: '#fff6d6',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1d18a',
  },
  secondaryActionText: {
    color: '#3a2f00',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  actionDisabled: {
    opacity: 0.6,
  },
})
