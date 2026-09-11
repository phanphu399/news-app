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
        <PulseLogo size={22} showText={true} scale={1} />
        <View style={styles.liveWrap}>
          <LiveDot size={5} color={online ? COLORS.success : COLORS.danger} />
          <Text style={[styles.liveText, { color: online ? COLORS.success : COLORS.danger }]}>
            {online ? '● Trực tiếp' : '○ Ngoại tuyến'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {build ? <Text style={styles.versionText}>{build}</Text> : null}
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          disabled={loading}
          hitSlop={8}
          accessibilityLabel="Cập nhật tin mới"
        >
          <Animated.View style={[styles.refreshIconWrap, { transform: [{ rotate }] }]}>
            <RefreshIcon size={17} color={loading ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.10)',
    backgroundColor: 'rgba(11,20,38,0.82)',
    backdropFilter: 'blur(14px)',
    zIndex: 50,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  liveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  liveText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
    fontFamily: FONT_FAMILY,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: FONT_FAMILY,
    opacity: 0.6,
  },
  refreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIconWrap: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});