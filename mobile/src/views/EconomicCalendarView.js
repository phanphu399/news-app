import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { BACKGROUND_COLOR } from '../config/constants';

const CALENDAR_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html, body, #tv_frame { margin:0; padding:0; width:100%; height:100%; background:transparent; }
</style>
</head>
<body>
  <div id="tv_frame">
    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container" style="height:100%">
      <div class="tradingview-widget-container__widget" style="height:100%"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-events.js" async>
      {
        "ec_calendar": {
          "priceScaleLabelColor": "#F3F5F7",
          "width": "100%",
          "height": "100%",
          "colorTheme": "dark",
          "isTransparent": true,
          "locale": "vi_VN",
          "importanceFilter": "-1,1",
          "ime_tz": "utc"
        }
      }
      <\/script>
    </div>
    <!-- TradingView Widget END -->
  </div>
</body>
</html>`;

export default function EconomicCalendarView() {
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: CALENDAR_HTML }}
        startInLoadingState
        javaScriptEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  webview: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
});