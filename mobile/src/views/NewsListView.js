import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import NewsCard from './NewsCard';
import { BACKGROUND_COLOR, TEXT_SECONDARY } from '../config/constants';

export default function NewsListView({ items, loading, error, onItemPress, onRefresh }) {
  const grouped = useMemo(() => {
    const groups = {};
    for (const item of items) {
      const key = item.category || 'Macro';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups).map(([category, list]) => ({ category, list }));
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.hint}>Đang tải tin tức...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={onRefresh}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={grouped}
      keyExtractor={(group) => group.category}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#38bdf8" />
        ) : undefined
      }
      renderItem={({ item: group }) => (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>{group.category}</Text>
          {group.list.map((newsItem) => (
            <NewsCard key={newsItem.id} item={newsItem} onPress={onItemPress} />
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  group: {
    marginBottom: 10,
  },
  groupTitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hint: {
    color: TEXT_SECONDARY,
    marginTop: 12,
  },
  retry: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  error: {
    color: '#f87171',
    textAlign: 'center',
  },
});