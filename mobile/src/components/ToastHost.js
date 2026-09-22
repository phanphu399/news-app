import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { subscribeToasts } from '../services/ToastService';
import { CheckIcon, CloseIcon, AlertCircleIcon, InfoIcon } from './UIIcons';
import { COLORS, FONT_FAMILY } from '../config/constants';
import useSwipeDismiss from '../hooks/useSwipeDismiss';

const MAX_TOASTS = 3;
const TOAST_TYPES = {
  success: { color: COLORS.success, Icon: CheckIcon, label: 'THÀNH CÔNG', badge: 'ĐÃ XONG' },
  error: { color: COLORS.danger, Icon: CloseIcon, label: 'LỖI', badge: 'THẤT BẠI' },
  warning: { color: COLORS.primary, Icon: AlertCircleIcon, label: 'CẢNH BÁO', badge: 'CHÚ Ý' },
  info: { color: COLORS.textSecondary, Icon: InfoIcon, label: 'THÔNG BÁO', badge: 'CẬP NHẬT' },
};

function ToastRow({ toast, offset, onDismiss }) {
  const slide = useRef(new Animated.Value(-140)).current;
  const { panHandlers, drag } = useSwipeDismiss({ onDismiss });
  const style = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const bullets = (toast.message || '\u00a0').split('\n').filter((line) => line.length);
  const ToastIcon = style.Icon;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [slide]);

  const handleAction = (action) => {
    onDismiss();
    action.onPress?.();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        { top: 10 + offset * 172, transform: [{ translateY: slide }, { translateX: drag }] },
      ]}
    >
      <View style={[styles.toast, { borderColor: `${style.color}33` }]} {...panHandlers}>
        <View style={styles.headerRow}>
          <View style={[styles.iconSquircle, { backgroundColor: `${style.color}14` }]}>
            <ToastIcon size={18} color={style.color} strokeWidth={2.2} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.label, { color: style.color }]}>{style.label}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {toast.title}
            </Text>
          </View>
        </View>

        {bullets.length > 0 && (
          <View style={styles.body}>
            {bullets.map((line, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: style.color }]} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={[styles.badge, { backgroundColor: `${style.color}14`, borderColor: `${style.color}33` }]}>
            <Text style={[styles.badgeText, { color: style.color }]}>
              {toast.badge || style.badge}
            </Text>
          </View>
          <View style={styles.actions}>
            {toast.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pill,
                  action.primary ? styles.pillPrimary : styles.pillGhost,
                  action.primary && { backgroundColor: style.color },
                ]}
                onPress={() => handleAction(action)}
                activeOpacity={0.85}
              >
                <Text style={[styles.pillText, action.primary ? styles.pillTextPrimary : { color: style.color }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.pill, styles.pillGhost]} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={[styles.pillText, { color: COLORS.textMuted }]}>Để sau</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    maxWidth: 420,
    backgroundColor: 'rgba(20, 27, 43, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 2,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  body: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 17,
    fontFamily: FONT_FAMILY,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillPrimary: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  pillTextPrimary: {
    color: '#0B0E14',
  },
});