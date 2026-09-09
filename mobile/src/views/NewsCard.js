import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatRelativeTime } from '../utils/time_format';
import {
  categoryStyle,
  COLORS,
  GRADIENTS,
  IMPORTANT_BORDER_COLOR,
  IMPORTANT_DOT_COLOR,
} from '../config/constants';

function timeTone(publishedAt) {
  const ageMinutes = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60);
  if (ageMinutes <= 60) return COLORS.success;
  if (ageMinutes <= 180) return COLORS.amber;
  return COLORS.textMuted;
}

export default function NewsCard({ item, onPress, dimmed }) {
  const isImportant = Boolean(item.isImportant);
  const cat = categoryStyle(item.category);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(item)}
      style={[styles.card, isImportant && styles.cardImportant, dimmed && styles.cardDimmed]}
    >
      <View style={[styles.accent, { backgroundColor: cat.color }]} />

      {isImportant && (
        <LinearGradient
          colors={GRADIENTS.importantRibbon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ribbon}
        >
          <View style={styles.importantDot} />
          <Text style={styles.importantText}>QUAN TRỌNG</Text>
        </LinearGradient>
      )}

      <View style={styles.body}>
        <Text style={[styles.title, isImportant && styles.titleImportant]} numberOfLines={3}>
          {item.titleVi || item.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.categoryChip, { borderColor: cat.color, backgroundColor: cat.bg }]}>
            <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={[styles.time, { color: timeTone(item.publishedAt) }]}>
            {formatRelativeTime(item.publishedAt)}
          </Text>
        </View>

        <View style={styles.sourceRow}>
          <View style={[styles.sourceDot, { borderColor: cat.color }]}>
            <Text style={styles.sourceInitial}>{(item.source || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.sourceName} numberOfLines={1}>
            {item.source || 'Unknown'}
          </Text>
          <Text style={styles.arrow}>↗</Text>
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
    borderColor: COLORS.borderSoft,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardImportant: {
    borderColor: IMPORTANT_BORDER_COLOR,
  },
  cardDimmed: {
    opacity: 0.55,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
  },
  ribbon: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  importantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 5,
    opacity: 0.9,
  },
  importantText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
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
    color: '#ffffff',
    fontWeight: '700',
    paddingRight: 92,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    minHeight: 20,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },
  sourceDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceInitial: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
  sourceName: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 7,
    fontWeight: '500',
  },
  arrow: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});