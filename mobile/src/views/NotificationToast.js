import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { COLORS, categoryStyle, FONT_FAMILY } from '../config/constants';
import TranslatedText from '../components/TranslatedText';

export default function NotificationToast({ item, onPress, onClose, offset }) {
  const slide = useRef(new Animated.Value(-140)).current;
  const cat = categoryStyle(item.category);

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.wrap, { top: 10 + offset * 148, transform: [{ translateY: slide }] }]}>
      <View style={[styles.toast, { borderColor: `${cat.color}55` }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconSquircle, { backgroundColor: `${cat.color}1f` }]}>
            <Text style={[styles.iconText, { color: cat.color }]}>⚡</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.label, { color: cat.color }]}>{cat.label}</Text>
            <TranslatedText style={styles.title} numberOfLines={2} text={item.title} />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.badge, { backgroundColor: `${cat.color}1f`, borderColor: `${cat.color}40` }]}>
            <View style={[styles.badgeDot, { backgroundColor: cat.color }]} />
            <Text style={[styles.badgeText, { color: cat.color }]}>TIN MỚI</Text>
          </View>
          <TouchableOpacity style={[styles.pill, { backgroundColor: cat.color }]} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.pillText}>Đọc ngay</Text>
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
    backgroundColor: '#131722',
    borderRadius: 16,
    borderWidth: 1,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 17,
    fontWeight: '900',
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginRight: 'auto',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillGhost: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILY,
  },
});