import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
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
            <Text style={styles.iconText}>âš¡</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.label}>TIN Má»šI</Text>
            <TranslatedText style={styles.title} numberOfLines={2} text={item.title} />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.pill, styles.pillPrimary]}
            onPress={onPress}
            activeOpacity={0.85}
          >
            <Text style={[styles.pillText, styles.pillTextPrimary]}>Äá»c ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, styles.pillGhost]} onPress={onClose} activeOpacity={0.85}>
            <Text style={[styles.pillText, { color: COLORS.textMuted }]}>Äá»ƒ sau</Text>
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
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
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
    backgroundColor: 'rgba(251,113,133,0.10)',
  },
  iconText: {
    fontSize: 15,
  },
  headerText: {
    flex: 1,
  },
  label: {
    color: '#FB7185',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 3,
    fontFamily: FONT_FAMILY,
  },
  title: {
    color: COLORS.text,
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
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pillPrimary: {
    backgroundColor: COLORS.primary,
  },
  pillGhost: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pillTextPrimary: {
    color: COLORS.primaryText,
  },
});