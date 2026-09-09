import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatRelativeTime } from '../utils/time_format';
import { categoryStyle, COLORS, IMPORTANT_BORDER_COLOR, IMPORTANT_DOT_COLOR } from '../config/constants';

function SourceBadge({ source }) {
  const initial = (source || '?').charAt(0).toUpperCase();
  return (
    <View style={styles.sourceBadge}>
      <Text style={styles.sourceBadgeText}>{initial}</Text>
    </View>
  );
}

export default function NewsCard({ item, onPress }) {
  const isImportant = Boolean(item.isImportant);
  const cat = categoryStyle(item.category);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(item)}
      style={[styles.card, isImportant && styles.cardImportant]}
    >
      <SourceBadge source={item.source} />

      <View style={styles.body}>
        {isImportant && (
          <View style={styles.importantRow}>
            <View style={styles.importantDot} />
            <Text style={styles.importantText}>QUAN TRỌNG</Text>
          </View>
        )}

        <Text style={[styles.title, isImportant && styles.titleImportant]} numberOfLines={3}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.categoryChip, { backgroundColor: cat.bg }]}>
            <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={styles.sourceName} numberOfLines={1}>
            {item.source || 'Unknown'}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(item.publishedAt)}</Text>
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
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  cardImportant: {
    borderColor: IMPORTANT_BORDER_COLOR,
    backgroundColor: COLORS.surface,
  },
  sourceBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  sourceBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  importantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  importantDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: IMPORTANT_DOT_COLOR,
    marginRight: 6,
  },
  importantText: {
    color: '#fda4af',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  titleImportant: {
    color: '#ffffff',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  categoryChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sourceName: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});