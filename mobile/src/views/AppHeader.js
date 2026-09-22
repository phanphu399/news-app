import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { PulseLogo, LiveDot } from '../components/PulseLogo';
import { RefreshIcon } from '../components/UIIcons';
import { COLORS, FONT_FAMILY } from '../config/constants';

function getBuildVersion() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return window.__ASTER_BUILD || '';
}

export default function AppHeader({ online, loading, onRefresh }) {
  const spin = useRef(new Animated.Value(0)).current;
  const build = getBuildVersion();

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

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.header}>
      <View style={styles.brandLeft}>
        <PulseLogo size={24} showText={true} scale={1.05} />
        <View
          style={[
            styles.liveWrap,
            {
              backgroundColor: online ? 'rgba(52, 211, 153, 0.08)' : 'rgba(244, 63, 94, 0.08)',
              borderColor: online ? 'rgba(52, 211, 153, 0.22)' : 'rgba(244, 63, 94, 0.22)',
            },
          ]}
        >
          <LiveDot size={6} color={online ? COLORS.success : COLORS.danger} />
          <Text style={[styles.liveText, { color: online ? COLORS.success : COLORS.danger }]}>
            {online ? 'Trực tiếp' : 'Ngoại tuyến'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {build ? (
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>{build}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          disabled={loading}
          hitSlop={8}
          accessibilityLabel="Cập nhật tin mới"
        >
          <Animated.View style={[styles.refreshIconWrap, { transform: [{ rotate }] }]}>
            <RefreshIcon size={16} color={loading ? COLORS.primary : COLORS.textSecondary} strokeWidth={2.2} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(8, 11, 17, 0.85)',
    backdropFilter: 'blur(20px)',
    zIndex: 100,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    gap: 10,
  },
  liveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  liveText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginLeft: 3,
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  refreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  refreshIconWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});