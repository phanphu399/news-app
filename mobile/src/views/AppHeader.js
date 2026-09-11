import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, APP_NAME, APP_TAGLINE, FONT_FAMILY } from '../config/constants';

const LOGO_SOURCE = require('../../assets/logo-mark.png');

function getBuildVersion() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return window.__ASTER_BUILD || '';
}

export default function AppHeader({ connected, loading, onRefresh }) {
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const compact = width < 400;
  const spin = useRef(new Animated.Value(0)).current;
  const build = getBuildVersion();
  const friendlyStatus = connected ? 'Trực tuyến' : 'Ngoại tuyến';

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
        <View style={[styles.logoBox, wide && styles.logoBoxWide]}>
          <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.name} numberOfLines={1}>
            {APP_NAME}
          </Text>
          {!compact && (
            <Text style={styles.tagline} numberOfLines={1}>
              {APP_TAGLINE}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {build && wide ? (
          <View style={styles.versionChip}>
            <Text style={styles.versionText}>{build}</Text>
          </View>
        ) : null}
        <View style={[styles.status, !connected && styles.statusOffline]}>
          <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.danger }]} />
          {!compact && <Text style={styles.statusText}>{friendlyStatus}</Text>}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    marginRight: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,168,92,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240,168,92,0.28)',
    overflow: 'hidden',
  },
  logoBoxWide: {
    width: 46,
    height: 46,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    flexShrink: 1,
    minWidth: 0,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },
  versionChip: {
    backgroundColor: 'rgba(240,168,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(240,168,92,0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  versionText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusOffline: {
    borderColor: 'rgba(229,99,110,0.35)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refreshButtonBusy: {
    opacity: 0.55,
  },
  refreshIcon: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
});