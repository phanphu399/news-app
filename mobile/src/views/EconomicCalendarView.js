import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../config/constants';

const importanceFilter = '-1,1';

function buildCalendarHtml(width, height) {
  const w = Math.max(320, Math.floor(width));
  const h = Math.max(400, Math.floor(height));
  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin:0; padding:0; width:100%; height:100%; background:#0b0e14; overflow:hidden; }
  .wrap { width:${w}px; height:${h}px; overflow-x:auto; overflow-y:auto; -webkit-overflow-scrolling:touch; }
  .tradingview-widget-container { width:${w}px; height:${h}px; }
  .tradingview-widget-container__widget { width:${w}px; height:${h}px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-events.js" async>
      {
        "colorTheme": "dark",
        "isTransparent": true,
        "width": ${w},
        "height": ${h},
        "locale": "vi_VN",
        "importanceFilter": "${importanceFilter}",
        "ime_tz": "Asia/Ho_Chi_Minh"
      }
      <\/script>
    </div>
  </div>
</body>
</html>`;
}

function todayLabel() {
  try {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return new Date().toLocaleDateString('vi-VN');
  }
}

function Legend({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

export default function EconomicCalendarView() {
  const boxRef = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const measure = () => {
      if (boxRef.current && Platform.OS === 'web') {
        const rect = boxRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    if (Platform.OS === 'web') {
      const observer = new ResizeObserver(measure);
      if (boxRef.current) observer.observe(boxRef.current);
      return () => observer.disconnect();
    }
    return undefined;
  }, []);

  const html = size ? buildCalendarHtml(size.width, size.height) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>LỊCH KINH TẾ</Text>
          <Text style={styles.headerDate}>
            {todayLabel().charAt(0).toUpperCase() + todayLabel().slice(1)}
          </Text>
        </View>
        <View style={styles.legend}>
          <Legend color={COLORS.important} label="Quan trọng" />
          <Legend color={COLORS.amber} label="TB" />
          <Legend color={COLORS.success} label="Thấp" />
        </View>
      </View>

      <View ref={boxRef} style={styles.chartBox}>
        {size && Platform.OS === 'web' ? (
          <iframe
            title="TradingView Economic Calendar"
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 0, background: COLORS.background }}
          />
        ) : size ? (
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            startInLoadingState
            javaScriptEnabled
            style={styles.webview}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  chartBox: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});