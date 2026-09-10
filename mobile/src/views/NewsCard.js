import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatRelativeTime } from '../utils/time_format';
import { categoryStyle, COLORS, GRADIENTS } from '../config/constants';
import { faviconUrl } from '../utils/domain';
import TranslatedText from '../components/TranslatedText';

function timeTone(publishedAt) {
  const ageMinutes = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60);
  if (ageMinutes <= 60) return COLORS.success;
  if (ageMinutes <= 180) return COLORS.amber;
  return COLORS.textSecondary;
}

export default function NewsCard({ item, onPress, dimmed }) {
  const isImportant = Boolean(item.isImportant);
  const cat = categoryStyle(item.category);
  const accentColor = isImportant ? COLORS.important : cat.color;
  const favicon = faviconUrl(item.source, item.url);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(item)}
      style={[styles.card, dimmed && styles.cardDimmed]}
    >
      {isImportant ? (
        <LinearGradient
          colors={GRADIENTS.importantRibbon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.accent}
        />
      ) : (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      )}

      {isImportant && (
        <View style={styles.hotBadge}>
          <View style={styles.hotDot} />
          <Text style={styles.hotText}>Nóng</Text>
        </View>
      )}

      {isImportant ? (
        <LinearGradient
          colors={GRADIENTS.cardTop}
          style={styles.topGlow}
          pointerEvents="none"
        />
      ) : null}

      <View style={styles.body}>
        <TranslatedText style={[styles.title, isImportant && styles.titleImportant]} numberOfLines={3} text={item.title} />

        <View style={styles.metaRow}>
          {favicon ? <Image source={{ uri: favicon }} style={styles.favicon} /> : null}
          <Text style={styles.source} numberOfLines={1}>
            {item.source || 'Unknown'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.time, { color: timeTone(item.publishedAt) }]}>
            {formatRelativeTime(item.publishedAt)}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.category, { color: cat.color }]} numberOfLines={1}>
            #{cat.short || cat.label.split(' ')[0]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginHorizontal: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDimmed: {
    opacity: 0.55,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 42,
  },
  hotBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(244,63,94,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.4)',
  },
  hotDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.important,
    marginRight: 4,
  },
  hotText: {
    color: COLORS.important,
    fontSize: 10,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  titleImportant: {
    fontWeight: '700',
    paddingRight: 54,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    minHeight: 16,
  },
  favicon: {
    width: 15,
    height: 15,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: COLORS.surfaceAlt,
  },
  source: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  dot: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginHorizontal: 5,
  },
  time: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
});