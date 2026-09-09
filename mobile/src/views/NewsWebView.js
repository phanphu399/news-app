import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

export default function NewsWebView({ url, onClose }) {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url.startsWith('http') ? url : `https://${url}` }}
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
    backgroundColor: '#0b0e14',
  },
  webview: {
    flex: 1,
  },
});