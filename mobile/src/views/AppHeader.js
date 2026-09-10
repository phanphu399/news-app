import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsLogoIcon } from '../components/TabIcons';
import { COLORS, GRADIENTS, APP_NAME, APP_TAGLINE } from '../config/constants';

export default function AppHeader({ connected, loading, onRefresh }) {
  const friendlyStatus = connected ? 'Trực tuyến' : 'Ngoại tuyến';

  return (
    <LinearGradient colors={GRADIENTS.header} style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logoBox}>
          <LinearGradient colors={GRADIENTS.brand} style={styles.logo}>
            <NewsLogoIcon size={22} color="#fff" strokeWidth={2.8} />
          </LinearGradient>
        </View>
        <View>
          <Text style={styles.name}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.status, !connected && styles.statusOffline]}>
          <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.statusText}>{friendlyStatus}</Text>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    padding: 2,
    marginRight: 10,
  },
  logo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
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
    backgroundColor: 'rgba(13,18,25,0.7)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  statusOffline: {
    borderColor: 'rgba(244,63,94,0.35)',
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
    backgroundColor: 'rgba(13,18,25,0.7)',
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