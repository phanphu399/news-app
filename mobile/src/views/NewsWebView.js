import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet, Platform } from 'react-native';
import { BACKGROUND_COLOR } from '../config/constants';
import { normalizeUrl } from '../utils/url';

export default function NewsWebView({ url, onClose }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          title="article"
          src={normalizeUrl(url)}
          style={{ flex: 1, width: '100%', height: '100%', border: 0, background: '#fff' }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: normalizeUrl(url) }}
        startInLoadingState
        domStorageEnabled
        javaScriptEnabled
        allowsBackForwardNavigationGestures
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
  },
});