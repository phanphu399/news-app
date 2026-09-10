import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, APP_NAME, APP_TAGLINE, FONT_FAMILY } from '../config/constants';

const LOGO_SOURCE = require('../../assets/breaking-news-logo-design.png');

export default function AppHeader({ connected, loading, onRefresh }) {
  const friendlyStatus = connected ? 'Trực tuyến' : 'Ngoại tuyến';
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      spin.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [loading, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={GRADIENTS.header} style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logoBox}>
          <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.name}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.status, !connected && styles.statusOffline]}>
          <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.statusText}>{friendlyStatus}</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonBusy]}
          onPress={onRefresh}
          disabled={loading}
          hitSlop={8}
          accessibilityLabel="Cập nhật tin mới"
        >
          <Animated.Text style={[styles.refreshIcon, { transform: [{ rotate }] }]}>
            ↻
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 86,
    height: 42,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontFamily: FONT_FAMILY,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,27,34,0.75)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusOffline: {
    borderColor: 'rgba(239,68,68,0.35)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22,27,34,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refreshButtonBusy: {
    opacity: 0.5,
  },
  refreshIcon: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '800',
  },
});