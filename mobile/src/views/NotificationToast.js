import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { BoltMark } from '../components/TabIcons';
import { COLORS, FONT_FAMILY } from '../config/constants';
import TranslatedText from '../components/TranslatedText';
import useSwipeDismiss from '../hooks/useSwipeDismiss';

export default function NotificationToast({ item, onPress, onClose, offset }) {
  const slide = useRef(new Animated.Value(-140)).current;
  const { panHandlers, drag } = useSwipeDismiss({ onDismiss: onClose });

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { top: 10 + offset * 140, transform: [{ translateY: slide }, { translateX: drag }] },
      ]}
    >
      <View style={styles.toast} {...panHandlers}>
        <View style={styles.headerRow}>
          <View style={styles.iconSquircle}>
            <BoltMark size={20} color={COLORS.important} strokeWidth={1.8} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.label}>TIN MỚI</Text>
            <TranslatedText style={styles.title} numberOfLines={2} text={item.title} />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.pill, styles.pillPrimary]}
            onPress={onPress}
            activeOpacity={0.85}
          >
            <Text style={[styles.pillText, styles.pillTextPrimary]}>Đọc ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, styles.pillGhost]} onPress={onClose} activeOpacity={0.85}>
            <Text style={[styles.pillText, { color: COLORS.textMuted }]}>Để sau</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  toast: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(20, 27, 43, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.30)',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
  },
  headerText: {
    flex: 1,
  },
  label: {
    color: '#F43F5E',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
    fontFamily: FONT_FAMILY,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pillPrimary: {
    backgroundColor: COLORS.primary,
  },
  pillGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pillTextPrimary: {
    color: '#0B0E14',
    fontWeight: '800',
  },
});