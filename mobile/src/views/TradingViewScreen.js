import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../config/constants';

const WIDGET_BASE = 'https://s.tradingview.com/widgetembed/';

export function buildTradingViewUrl({ symbol = 'OANDA:XAUUSD', interval = 60 } = {}) {
  const params = new URLSearchParams({
    frameElementId: 'tradingview_lite',
    symbol,
    interval: String(interval),
    hide_side_toolbar: '0',
    hide_top_toolbar: '1',
    theme: 'dark',
    style: '1',
    timezone: 'Asia/Ho_Chi_Minh',
    locale: 'vi',
    enable_publishing: '0',
    allow_symbol_change: '1',
    container_id: 'tradingview_lite',
    autosize: '1',
  });
  return `${WIDGET_BASE}?${params.toString()}`;
}

export default function TradingViewScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.chartBox}>
        {Platform.OS === 'web' ? (
          <iframe
            title="NEWS XAUUSD Chart"
            src={buildTradingViewUrl()}
            style={{ flex: 1, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <WebView
            source={{ uri: buildTradingViewUrl() }}
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  chartBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});