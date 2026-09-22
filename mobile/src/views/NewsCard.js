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
      activeOpacity={0.75}
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
          <View style={[styles.catBadge, { backgroundColor: cat.bg, borderColor: cat.border || `${cat.color}30` }]}>
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
          numberOfLines={2}
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
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginHorizontal: 6,
    marginVertical: 0,
  },
  cardHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardImportant: {
    borderBottomColor: 'rgba(244, 63, 94, 0.20)',
  },
  cardDimmed: {
    opacity: 0.5,
  },
  body: {
    padding: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
  },
  catDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4.5,
  },
  catText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: FONT_FAMILY,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(244, 63, 94, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.20)',
  },
  hotDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4.5,
    backgroundColor: '#FB7185',
  },
  hotText: {
    color: '#FB7185',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 14.5,
    lineHeight: 21,
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
    marginTop: 10,
    minHeight: 18,
  },
  monogram: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  monogramText: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  source: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
  },
  dot: {
    color: '#334155',
    fontSize: 12,
    marginHorizontal: 5,
  },
  time: {
    color: '#64748B',
    fontSize: 11.5,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
});