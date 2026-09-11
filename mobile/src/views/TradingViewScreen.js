import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_FAMILY } from '../config/constants';
import { BoltMark } from '../components/TabIcons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const WIDGET_BASE = 'https://s.tradingview.com/widgetembed/';

export function buildTradingViewUrl({ symbol = 'OANDA:XAUUSD', interval = 60 } = {}) {
  const params = new URLSearchParams({
    frameElementId: 'tradingview_lite',
    symbol,
    interval: String(interval),
    hide_side_toolbar: '0',
    hide_top_toolbar: '0',
    theme: 'dark',
    style: '1',
    timezone: 'Asia/Ho_Chi_Minh',
    locale: 'vi',
    enable_publishing: '0',
    allow_symbol_change: '1',
    withdateranges: '1',
    saveimage: '1',
    symboledit: '1',
    container_id: 'tradingview_lite',
    autosize: '1',
  });
  return `${WIDGET_BASE}?${params.toString()}`;
}

export default function TradingViewScreen({ onRequestChartTouch }) {
  const insets = useSafeAreaInsets();
  const { online } = useOnlineStatus();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const urlKey = useRef(0);
  const [iframeKey, setIframeKey] = useState(0);

  const onLoad = useCallback(() => {
    setFailed(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    setLoaded(true);
  }, [fadeAnim]);

  const onError = useCallback(() => {
    setLoaded(false);
    setFailed(true);
    fadeAnim.setValue(0);
  }, [fadeAnim]);

  const handleReload = useCallback(() => {
    fadeAnim.setValue(0);
    setLoaded(false);
    setFailed(false);
    setIframeKey((k) => k + 1);
  }, [fadeAnim]);

  const statusText = !online
    ? 'Ngoại tuyến — không hiển thị giá cũ. Thử lại khi có mạng.'
    : failed
    ? 'Không tải được biểu đồ — bấm Trực tiếp để thử lại.'
    : 'Đang tải biểu đồ…';

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => onRequestChartTouch?.()}
      pointerEvents="box-none"
    >
      {!loaded && (
        <View style={styles.placeholder}>
          <BoltMark size={40} color={online ? COLORS.primary : COLORS.textMuted} strokeWidth={1.2} />
          <Text style={[styles.placeholderText, { color: online ? COLORS.textMuted : COLORS.danger }]}>
            {statusText}
          </Text>
        </View>
      )}

      <Animated.View style={[styles.chartBox, { opacity: fadeAnim }]}>
        {Platform.OS === 'web' && online ? (
          <iframe
            key={iframeKey}
            title="MacroPulse XAUUSD Chart"
            src={buildTradingViewUrl()}
            style={styles.iframe}
            onLoad={onLoad}
            onError={onError}
          />
        ) : null}
      </Animated.View>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleReload}
        activeOpacity={0.8}
        hitSlop={10}
        accessibilityLabel="Tải lại biểu đồ trực tiếp"
      >
        <BoltMark size={14} color={online ? COLORS.primary : COLORS.textMuted} strokeWidth={2} />
        <Text style={[styles.fabText, { color: online ? COLORS.textSecondary : COLORS.textMuted }]}>
          {online ? 'Trực tiếp' : 'Ngoại tuyến'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 12,
    fontFamily: FONT_FAMILY,
  },
  chartBox: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  iframe: {
    flex: 1,
    width: '100%',
    height: '100%',
    border: 0,
    backgroundColor: COLORS.background,
  },
  fab: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32,43,68,0.88)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
});
