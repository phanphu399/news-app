import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { PulseLogo, LiveDot } from '../components/PulseLogo';
import { COLORS, FONT_FAMILY } from '../config/constants';

function getBuildVersion() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return window.__ASTER_BUILD || '';
}

export default function AppHeader({ online, loading, onRefresh }) {
  const spin = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const build = getBuildVersion();

  // Fade-in header khi mount
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Rotate khi loading
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
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      {/* Glow line ở bottom border */}
      <View style={styles.glowLine} />

      <View style={styles.brandLeft}>
        <PulseLogo size={22} showText={true} scale={1.0} />
        <View
          style={[
            styles.liveWrap,
            {
              backgroundColor: online
                ? 'rgba(0, 230, 118, 0.08)'
                : 'rgba(255, 59, 92, 0.08)',
              borderColor: online
                ? 'rgba(0, 230, 118, 0.25)'
                : 'rgba(255, 59, 92, 0.25)',
            },
          ]}
        >
          <LiveDot size={5} color={online ? COLORS.success : COLORS.danger} />
          <Text
            style={[
              styles.liveText,
              { color: online ? COLORS.success : COLORS.danger },
            ]}
          >
            {online ? 'LIVE' : 'OFFLINE'}
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
          style={[styles.refreshBtn, loading && styles.refreshBtnLoading]}
          onPress={onRefresh}
          disabled={loading}
          hitSlop={10}
          accessibilityLabel="Cập nhật tin mới"
        >
          <Animated.View style={[styles.refreshIconWrap, { transform: [{ rotate }] }]}>
            <RefreshSvg
              size={15}
              color={loading ? COLORS.primary : COLORS.textSecondary}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Inline SVG refresh icon
function RefreshSvg({ size = 15, color = '#8899AA' }) {
  const { Svg, Path } = require('react-native-svg');
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M23 4v6h-6" />
      <Path d="M1 20v-6h6" />
      <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <Path d="M21 14a9 9 0 0 1-14.85 3.36L1 14" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    backgroundColor: '#05070A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  glowLine: {
    display: 'none', // Remove glow for professional look
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
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1,
    gap: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONT_MONO,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  versionBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 10,
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
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  refreshBtnLoading: {
    borderColor: 'rgba(0, 212, 255, 0.30)',
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  refreshIconWrap: {
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});