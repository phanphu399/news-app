import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Card from '../components/Card';
import { COLORS, FONT_FAMILY } from '../config/constants';

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

export default function TradingViewScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>BIỂU ĐỒ XAUUSD</Text>
            <Text style={styles.chartSub}>OANDA · Vàng giao ngay · múi giờ Hồ Chí Minh</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TRỰC TIẾP</Text>
          </View>
        </View>
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
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>Nguồn: TradingView · Kéo chuột để thu phóng, vẽ chỉ báo tự do</Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    padding: 12,
  },
  chartCard: {
    flex: 1,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    backgroundColor: COLORS.surfaceAlt,
  },
  chartTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: FONT_FAMILY,
  },
  chartSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  liveText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: FONT_FAMILY,
  },
  chartBox: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chartFooter: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },
  chartFooterText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: FONT_FAMILY,
  },
});