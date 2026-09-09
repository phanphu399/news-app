import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import NewsCard from './NewsCard';
import { COLORS, categoryStyle } from '../config/constants';

const ALL = '__all__';

function useShimmer() {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonCard() {
  const shimmer = useShimmer();
  return (
    <Animated.View style={[styles.skeletonCard, { opacity: shimmer }]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.body}>
        <View style={[styles.skeletonLine, { width: '35%' }]} />
        <View style={[styles.skeletonLine, { width: '96%', marginTop: 9 }]} />
        <View style={[styles.skeletonLine, { width: '78%', marginTop: 6 }]} />
        <View style={styles.skeletonMeta} />
      </View>
    </Animated.View>
  );
}

export default function NewsListView({ items, loading, error, onItemPress, onRefresh }) {
  const [filter, setFilter] = useState(ALL);

  const chips = useMemo(() => {
    const counts = new Map();
    for (const item of items) {
      const key = item.category || 'Macro';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [
      { key: ALL, label: 'Tất cả', count: items.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({ key, label: categoryStyle(key).label, count })),
    ];
  }, [items]);

  const grouped = useMemo(() => {
    const filtered = filter === ALL ? items : items.filter((item) => (item.category || 'Macro') === filter);
    const order = ['Macro', 'XAUUSD', 'Paywall', 'Geopolitics', 'Custom'];
    const groups = new Map();
    for (const item of filtered) {
      const key = item.category || 'Macro';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    return [...groups.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([category, list]) => ({ category, list }));
  }, [items, filter]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ScrollView contentContainerStyle={styles.skeletonList} scrollEnabled={false}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
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
        <Text style={styles.errorIcon}>📡</Text>
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
    <View style={styles.flex}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsBar}
        contentContainerStyle={styles.chipsContent}
      >
        {chips.map((chip) => {
          const isActive = filter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setFilter(chip.key)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip.label}</Text>
              <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                  {chip.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chipsBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    backgroundColor: COLORS.background,
  },
  chipsContent: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.surface,
    paddingLeft: 12,
    paddingRight: 7,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(56,189,248,0.14)',
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  chipCount: {
    marginLeft: 7,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 999,
    minWidth: 18,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipCountActive: {
    backgroundColor: COLORS.primary,
  },
  chipCountText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chipCountTextActive: {
    color: COLORS.primaryText,
  },
  content: {
    paddingVertical: 10,
    paddingBottom: 28,
  },
  group: {
    marginBottom: 14,
    marginTop: 4,
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
    paddingTop: 8,
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
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
    marginRight: 8,
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
  errorIcon: {
    fontSize: 36,
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