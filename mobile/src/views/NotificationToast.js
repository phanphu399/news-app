import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { COLORS, categoryStyle } from '../config/constants';

export default function NotificationToast({ item, onPress, onClose, offset }) {
  const slide = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, []);

  const cat = categoryStyle(item.category);

  return (
    <Animated.View style={[styles.wrap, { top: 8 + offset * 96, transform: [{ translateY: slide }] }]}>
      <TouchableOpacity style={styles.toast} activeOpacity={0.9} onPress={onPress}>
        <View style={[styles.accent, { backgroundColor: cat.color }]} />
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={[styles.cat, { color: cat.color }]}>{cat.label}</Text>
            <Text style={styles.badge}>🔴 NOVA</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.titleVi || item.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
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
  },
  toast: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#0d1420',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  cat: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  badge: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  title: {
    color: COLORS.text,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
  },
  closeBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});