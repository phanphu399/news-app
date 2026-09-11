import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { formatRelativeTime } from '../utils/time_format';
import { categoryStyle, COLORS, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';
import { faviconUrl } from '../utils/domain';
import TranslatedText from '../components/TranslatedText';

export default function NewsCard({ item, onPress, dimmed }) {
  const isImportant = Boolean(item.isImportant);
  const cat = categoryStyle(item.category);
  const favicon = faviconUrl(item.source, item.url);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
      style={[styles.card, dimmed && styles.cardDimmed]}
    >
      {isImportant && (
        <View style={styles.hotBadge}>
          <Text style={styles.hotText}>🔥 Nóng</Text>
        </View>
      )}

      <View style={styles.body}>
        <TranslatedText
          style={[styles.title, isImportant && styles.titleImportant]}
          numberOfLines={3}
          text={item.title}
        />

        <View style={styles.metaRow}>
          {favicon ? <Image source={{ uri: favicon }} style={styles.favicon} /> : null}
          <Text style={styles.source} numberOfLines={1}>
            {item.source || 'Unknown'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{formatRelativeTime(item.publishedAt)}</Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText} numberOfLines={1}>
              #{cat.short || cat.label.split(' ')[0]}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 12,
    marginVertical: 5,
  },
  cardDimmed: {
    opacity: 0.55,
  },
  hotBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(229,99,110,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(229,99,110,0.22)',
  },
  hotText: {
    color: '#FB7185',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  body: {
    padding: 14,
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
    paddingRight: 58,
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
  categoryTag: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
});