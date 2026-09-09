import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, APP_NAME, APP_TAGLINE } from '../config/constants';

export default function AppHeader({ connected, loading, onRefresh }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{APP_NAME.charAt(0)}</Text>
          <View style={styles.logoDot} />
        </View>
        <View>
          <Text style={styles.name}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.status}>
          <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.statusText}>{connected ? 'Live' : 'Offline'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonBusy]}
          onPress={onRefresh}
          disabled={loading}
          hitSlop={8}
        >
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#101826',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
  },
  logoText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  logoDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.important,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  name: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refreshButtonBusy: {
    opacity: 0.5,
  },
  refreshIcon: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '800',
  },
});