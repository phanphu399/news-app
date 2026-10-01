import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Easing,
  Platform,
} from 'react-native';
import NewsCard from './NewsCard';
import { COLORS, categoryStyle, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';

const ALL = '__all__';

// ─── Shimmer hook ─────────────────────────────────────────────────────────────
function useShimmer() {
  const translate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translate, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translate]);
  return translate;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ index = 0 }) {
  const shimmer = useShimmer();
  const opacity = useRef(new Animated.Value(0)).current;
  const sweepX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-240, 360] });

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      {/* Accent bar placeholder */}
      <View style={styles.skeletonAccent} />
      <View style={styles.skeletonColumn}>
        {/* Category badge skeleton */}
        <View style={[styles.skeletonLine, { width: 52, height: 18, borderRadius: 5, marginBottom: 9 }]} />
        {/* Title lines */}
        <View style={[styles.skeletonLine, { width: '95%', height: 14, marginBottom: 7 }]} />
        <View style={[styles.skeletonLine, { width: '72%', height: 14 }]} />
        {/* Meta */}
        <View style={styles.skeletonMeta} />
      </View>
      {/* Shimmer sweep overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.shimmerSweep, { transform: [{ translateX: sweepX }] }]}
      />
    </Animated.View>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ chip, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();

  const borderColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.07)', 'rgba(0, 212, 255, 0.55)'],
  });
  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.02)', 'rgba(0, 212, 255, 0.10)'],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.chip,
            { backgroundColor: bgColor, borderColor },
            isActive && styles.chipActiveShadow,
          ]}
        >
          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
            {chip.label}
          </Text>
          <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>
            {chip.count}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main NewsListView ────────────────────────────────────────────────────────
export default function NewsListView({ items, loading, error, onRefresh, newItemId, onItemPress }) {
  const [filter, setFilter] = useState(ALL);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Search focus animation
  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [searchFocused]);

  const searchBorder = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.07)', 'rgba(0, 212, 255, 0.50)'],
  });
  const searchBg = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.025)', 'rgba(0, 212, 255, 0.05)'],
  });

  // Build chips (categories)
  const chips = useMemo(() => {
    const counts = {};
    for (const item of items) {
      const cat = item.category || 'Macro';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const catChips = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        key,
        label: categoryStyle(key)?.short || key,
        count,
      }));
    return [{ key: ALL, label: 'Tất cả', count: items.length }, ...catChips];
  }, [items]);

  // Filtered list
  const flatList = useMemo(() => {
    let list = filter === ALL ? items : items.filter((i) => i.category === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.source?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, query]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <NewsCard
        key={item.id}
        index={index}
        item={item}
        onPress={onItemPress}
        isNew={item.id === newItemId}
      />
    ),
    [onItemPress, newItemId]
  );

  // ── Trạng thái lỗi ──
  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚡</Text>
        <Text style={styles.errorTitle}>Không tải được dữ liệu</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={onRefresh}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Skeleton loading ──
  if (loading && items.length === 0) {
    return (
      <View style={styles.flex}>
        <View style={styles.skeletonList}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </View>
      </View>
    );
  }

  // ── Empty ──
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
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsBar}
        contentContainerStyle={styles.chipsContent}
      >
        {chips.map((chip) => (
          <FilterChip
            key={chip.key}
            chip={chip}
            isActive={filter === chip.key}
            onPress={() => setFilter(chip.key)}
          />
        ))}
      </ScrollView>

      {/* Search bar */}
      <Animated.View
        style={[
          styles.searchWrap,
          { backgroundColor: searchBg, borderColor: searchBorder },
        ]}
      >
        <SearchSvg
          size={14}
          color={searchFocused ? COLORS.primary : COLORS.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Tìm tin theo từ khoá hoặc nguồn…"
          placeholderTextColor={COLORS.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
            <CloseSvg size={13} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Empty filter state */}
      {flatList.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Không có tin khớp</Text>
          <Text style={styles.errorBody}>
            {query.trim()
              ? `Không tìm thấy tin nào khớp "${query.trim()}". Thử từ khoá khác.`
              : 'Category này hiện chưa có tin nào.'}
          </Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => { setFilter(ALL); setQuery(''); }}
          >
            <Text style={styles.retryText}>Xem tất cả tin</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
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
          renderItem={renderItem}
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={12}
          windowSize={10}
          initialNumToRender={12}
        />
      )}
    </View>
  );
}

// ─── Mini SVG Icons ──────────────────────────────────────────────────────────
function SearchSvg({ size = 14, color = '#4A5568' }) {
  const { default: Svg, Circle, Line } = require('react-native-svg');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 8, flexShrink: 0 }}
    >
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
}

function CloseSvg({ size = 13, color = '#4A5568' }) {
  const { default: Svg, Line } = require('react-native-svg');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.5} strokeLinecap="round"
    >
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Filter chips
  chipsBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 212, 255, 0.08)',
    backgroundColor: 'rgba(5, 7, 10, 0.94)',
    minHeight: 48,
    flexShrink: 0,
  },
  chipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 7,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 7,
    paddingVertical: 5,
    gap: 5,
  },
  chipActiveShadow: {
    // Web shadow
    shadowColor: '#00D4FF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  chipCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  chipCountActive: {
    color: COLORS.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
  },

  // Search bar
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 11,
    height: 37,
    alignSelf: 'stretch',
    maxWidth: 896,
    backgroundColor: 'rgba(5, 7, 10, 0.94)',
    borderColor: 'rgba(0, 212, 255, 0.12)',
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13.5,
    fontFamily: FONT_FAMILY,
    paddingVertical: 0,
  },

  // List content
  content: {
    paddingTop: 4,
    paddingBottom: 36,
  },

  // Skeleton
  skeletonList: {
    paddingTop: 4,
  },
  skeletonCard: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingRight: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonAccent: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonColumn: {
    flex: 1,
  },
  skeletonLine: {
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonMeta: {
    marginTop: 11,
    height: 14,
    width: '42%',
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  shimmerSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(0, 212, 255, 0.04)',
    borderRadius: 40,
    // Skew hiệu ứng sweep
    ...(Platform.OS === 'web' ? { transform: [{ skewX: '-12deg' }] } : {}),
  },

  // Center states
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  errorIcon: { fontSize: 34 },
  errorTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  errorBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    fontFamily: FONT_FAMILY,
    maxWidth: 300,
  },
  retry: {
    marginTop: 18,
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.35)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
});