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
import { COLORS, categoryStyle } from '../config/constants';

function SkeletonCard({ width }) {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.body}>
        <View style={[styles.skeletonLine, { width: '35%' }]} />
        <View style={[styles.skeletonLine, { width, marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: '82%', marginTop: 6 }]} />
        <View style={styles.skeletonMeta} />
      </View>
    </View>
  );
}

export default function NewsListView({ items, loading, error, onItemPress, onRefresh }) {
  const grouped = useMemo(() => {
    const order = ['Macro', 'XAUUSD', 'Paywall', 'Geopolitics', 'Custom'];
    const groups = new Map();
    for (const item of items) {
      const key = item.category || 'Macro';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    return [...groups.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([category, list]) => ({ category, list }));
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.skeletonList}>
          <SkeletonCard width="95%" />
          <SkeletonCard width="70%" />
          <SkeletonCard width="88%" />
          <SkeletonCard width="60%" />
          <SkeletonCard width="92%" />
        </View>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Không kết nối được dữ liệu</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={onRefresh}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📡</Text>
        <Text style={styles.errorTitle}>Chưa có tin tức</Text>
        <Text style={styles.errorBody}>
          Đang chờ dữ liệu từ server... Tin mới sẽ xuất hiện ngay khi có.
        </Text>
        <TouchableOpacity style={styles.retry} onPress={onRefresh}>
          <Text style={styles.retryText}>Làm mới</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={grouped}
      keyExtractor={(group) => group.category}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
          progressBackgroundColor={COLORS.surface}
        />
      }
      renderItem={({ item: group }) => {
        const cat = categoryStyle(group.category);
        return (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupBar, { backgroundColor: cat.color }]} />
              <Text style={styles.groupTitle}>{cat.label}</Text>
              <View style={styles.groupCount}>
                <Text style={styles.groupCountText}>{group.list.length}</Text>
              </View>
            </View>
            {group.list.map((newsItem) => (
              <NewsCard key={newsItem.id} item={newsItem} onPress={onItemPress} />
            ))}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 10,
    paddingBottom: 28,
  },
  group: {
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8,
    marginRight: 16,
  },
  groupBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    marginRight: 8,
  },
  groupTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  groupCount: {
    marginLeft: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  groupCountText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  skeletonList: {
    width: '100%',
    maxWidth: 760,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  skeletonAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    marginRight: 12,
    marginTop: 4,
  },
  body: { flex: 1 },
  skeletonLine: {
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
  },
  skeletonMeta: {
    marginTop: 10,
    height: 16,
    width: '45%',
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  errorBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyIcon: {
    fontSize: 40,
  },
  retry: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 26,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(56,189,248,0.08)',
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});