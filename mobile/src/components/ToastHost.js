import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { subscribeToasts } from '../services/ToastService';
import { COLORS } from '../config/constants';

const MAX_TOASTS = 3;
const TOAST_TYPES = {
  success: { color: COLORS.success, icon: '✓', label: 'Thành công' },
  error: { color: COLORS.danger, icon: '✕', label: 'Lỗi' },
  warning: { color: COLORS.amber, icon: '⚠', label: 'Chú ý' },
  info: { color: COLORS.primary, icon: 'ℹ', label: 'Thông báo' },
};

function ToastRow({ toast, offset, onDismiss }) {
  const slide = useRef(new Animated.Value(-120)).current;
  const style = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [slide]);

  return (
    <Animated.View
      style={[styles.wrap, { top: 8 + offset * 96, transform: [{ translateY: slide }] }]}
    >
      <View style={[styles.toast, { borderColor: style.color }]}>
        <View style={[styles.iconWrap, { backgroundColor: style.color }]}>
          <Text style={styles.iconText}>{style.icon}</Text>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: style.color }]}>{style.label}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={10}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToasts((toast) => {
    if (toast.dismiss) {
      setToasts((list) => list.filter((item) => item.id !== toast.id));
    } else {
      setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), toast]);
    }
  }), []);

  const dismiss = (id) => setToasts((list) => list.filter((item) => item.id !== id));

  return (
    <>
      {toasts.map((toast, index) => (
        <ToastRow key={toast.id} toast={toast} offset={index} onDismiss={() => dismiss(toast.id)} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1100,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    backgroundColor: '#0d1420',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  body: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  message: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});