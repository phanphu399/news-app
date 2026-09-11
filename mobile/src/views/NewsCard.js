import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatRelativeTime } from '../utils/time_format';
import { categoryStyle, COLORS, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';
import TranslatedText from '../components/TranslatedText';

function monogram(source) {
  const s = String(source || '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/);
  if (parts.length === 1) return s.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const NewsCard = memo(function NewsCard({ item, onPress, dimmed }) {
  const isImportant = Boolean(item.isImportant);
  const cat = categoryStyle(item.category);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
      style={[styles.card, dimmed && styles.cardDimmed]}
    >
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.catRow}>
            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
            <Text style={[styles.catText, { color: cat.color }]} numberOfLines={1}>
              {cat.short}
            </Text>
          </View>
          {isImportant && (
            <View style={styles.hotRow}>
              <View style={styles.hotBadge} />
              <Text style={styles.hotText}>NÓNG</Text>
            </View>
          )}
        </View>

        <TranslatedText
          style={[styles.title, isImportant && styles.titleImportant]}
          numberOfLines={3}
          text={item.title}
        />

        <View style={styles.metaRow}>
          <View style={[styles.monogram, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
            <Text style={styles.monogramText}>{monogram(item.source)}</Text>
          </View>
          <Text style={styles.source} numberOfLines={1}>
            {item.source || 'Unknown'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{formatRelativeTime(item.publishedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default NewsCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 12,
    marginVertical: 5,
    overflow: 'hidden',
  },
  accent: {
    display: 'none',
  },
  cardDimmed: {
    opacity: 0.55,
  },
  body: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  catText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: FONT_FAMILY,
  },
  hotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: COLORS.important,
  },
  hotText: {
    color: COLORS.important,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: FONT_FAMILY,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  titleImportant: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    minHeight: 16,
  },
  monogram: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  monogramText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  source: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
  },
  dot: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginHorizontal: 5,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
});