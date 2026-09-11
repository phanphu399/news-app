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
import { COLORS, categoryStyle, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';

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

  const flatList = useMemo(() => {
    if (filter === ALL) return items;
    return items.filter((item) => (item.category || 'Macro') === filter);
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
      <View style={styles.chipsBar}>
        {chips.map((chip) => {
          const isActive = filter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setFilter(chip.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip.label}</Text>
              <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>{chip.count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={flatList}
        keyExtractor={(item) => item.id}
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
        renderItem={({ item }) => <NewsCard item={item} onPress={onItemPress} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chipsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingLeft: 12,
    paddingRight: 9,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(240,168,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(240,168,92,0.30)',
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  chipCount: {
    marginLeft: 6,
    color: COLORS.textMuted,
    fontSize: 10,
    opacity: 0.6,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  chipCountActive: {
    color: COLORS.primary,
  },
  content: {
    paddingVertical: 10,
    paddingBottom: 28,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 26,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryText: {
    color: COLORS.primaryText,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
});