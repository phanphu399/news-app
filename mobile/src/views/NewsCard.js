import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatRelativeTime } from '../utils/time_format';
import {
  IMPORTANT_BORDER_COLOR,
  IMPORTANT_DOT_COLOR,
  CARD_BACKGROUND,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../config/constants';

export default function NewsCard({ item, onPress }) {
  const isImportant = Boolean(item.isImportant);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(item)}
      style={[styles.card, isImportant && styles.cardImportant]}
    >
      {isImportant && <View style={styles.importantDot} />}
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.source, isImportant && styles.sourceImportant]}>
            {item.source || 'Unknown'}
          </Text>
          <Text style={[styles.category]}>{item.category || 'Macro'}</Text>
          <Text style={styles.time}>{formatRelativeTime(item.publishedAt)}</Text>
        </View>
        <Text style={[styles.title, isImportant && styles.titleImportant]} numberOfLines={3}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardImportant: {
    borderColor: IMPORTANT_BORDER_COLOR,
  },
  importantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: IMPORTANT_DOT_COLOR,
    marginRight: 10,
    marginTop: 6,
  },
  body: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  source: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
  },
  sourceImportant: {
    color: '#fda4af',
  },
  category: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  time: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 'auto',
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  titleImportant: {
    color: '#fff1f2',
    fontWeight: '700',
  },
});