import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet, Easing } from 'react-native';
import { COLORS, FONT_FAMILY } from '../config/constants';
import TranslatedText from '../components/TranslatedText';
import useSwipeDismiss from '../hooks/useSwipeDismiss';

export default function NotificationToast({ item, onPress, onClose, offset = 0 }) {
  const slideY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const { panHandlers, drag } = useSwipeDismiss({ onDismiss: onClose });

  useEffect(() => {
    // Slide in từ top
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Glow pulse sau khi xuất hiện
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowPulse, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    });

    // Tự động dismiss sau 8 giây
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, []);

  const borderGlow = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 59, 92, 0.30)', 'rgba(255, 59, 92, 0.65)'],
  });
  const shadowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: 10 + offset * 130,
          opacity,
          transform: [{ translateY: slideY }, { translateX: drag }],
        },
      ]}
      {...panHandlers}
    >
      <Animated.View
        style={[
          styles.toast,
          {
            borderColor: borderGlow,
            shadowOpacity,
          },
        ]}
      >
        {/* Top accent line */}
        <View style={styles.topAccent} />

        <View style={styles.headerRow}>
          {/* Flashing icon */}
          <FlashingAlert />

          <View style={styles.headerText}>
            <Text style={styles.label}>⚡ TIN NÓNG MỚI</Text>
            <TranslatedText style={styles.title} numberOfLines={2} text={item.title} />
          </View>
        </View>

        {/* Source + time */}
        {item.source && (
          <Text style={styles.source}>
            {item.source}
            {item.publishedAt
              ? ` · ${new Date(item.publishedAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : ''}
          </Text>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.pillPrimary}
            onPress={onPress}
            activeOpacity={0.85}
          >
            <Text style={styles.pillTextPrimary}>Đọc ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillGhost}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.pillTextGhost}>Để sau</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// Icon nhỏ nhấp nháy
function FlashingAlert() {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.alertIcon, { opacity: blink }]}>
      <Text style={styles.alertEmoji}>🔴</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1100,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  toast: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(12, 6, 10, 0.97)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#FF3B5C',
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF3B5C',
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertEmoji: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
  },
  label: {
    color: '#FF3B5C',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  title: {
    color: '#F0F4F8',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  source: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT_FAMILY,
    marginTop: 8,
    marginLeft: 38,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  pillPrimary: {
    backgroundColor: '#FF3B5C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pillTextPrimary: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  pillGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pillTextGhost: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});