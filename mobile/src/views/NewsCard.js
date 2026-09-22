import React, { memo, useState } from 'react';
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
  const [hovered, setHovered] = useState(false);
  const isImportant = Boolean(item.isImportant);
  const cat = categoryStyle(item.category);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[
        styles.card,
        hovered && styles.cardHovered,
        isImportant && styles.cardImportant,
        dimmed && styles.cardDimmed,
      ]}
    >
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.catBadge, { backgroundColor: cat.bg, borderColor: `${cat.color}35` }]}>
            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
            <Text style={[styles.catText, { color: cat.color }]} numberOfLines={1}>
              {cat.short}
            </Text>
          </View>
          {isImportant && (
            <View style={styles.hotBadge}>
              <View style={styles.hotDot} />
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
          <View style={styles.monogram}>
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
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginHorizontal: 12,
    marginVertical: 5,
    overflow: 'hidden',
  },
  cardHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  cardImportant: {
    borderColor: 'rgba(244, 63, 94, 0.22)',
  },
  cardDimmed: {
    opacity: 0.55,
  },
  body: {
    padding: 15,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderWidth: 1,
  },
  catDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  catText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: FONT_FAMILY,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.30)',
  },
  hotDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
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
    color: '#F8FAFC',
    fontSize: 15.5,
    lineHeight: 23,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  titleImportant: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    minHeight: 18,
  },
  monogram: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  monogramText: {
    color: COLORS.textSecondary,
    fontSize: 8.5,
    fontWeight: '700',
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
    color: '#475569',
    fontSize: 12,
    marginHorizontal: 6,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
});