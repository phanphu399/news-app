import React, { useMemo, useRef, useState, useEffect } from 'react';
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
} from 'react-native';
import NewsCard from './NewsCard';
import { SearchIcon, CloseIcon } from '../components/UIIcons';
import { COLORS, categoryStyle, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';

const ALL = '__all__';

function useShimmer() {
  const translate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translate, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translate]);
  return translate;
}

function SkeletonCard() {
  const shimmer = useShimmer();
  const sweepX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-180, 320] });
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonColumn}>
        <View style={[styles.skeletonLine, { width: '35%' }]} />
        <View style={[styles.skeletonLine, { width: '96%', marginTop: 9 }]} />
        <View style={[styles.skeletonLine, { width: '78%', marginTop: 6 }]} />
        <View style={styles.skeletonMeta} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmerSweep,
          { transform: [{ translateX: sweepX }, { rotate: '-8deg' }] },
        ]}
      />
    </View>
  );
}

function NewsItem({ index, item, onPress }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: Math.min(index * 50, 600),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
          },
        ],
      }}
    >
      <NewsCard item={item} onPress={onPress} />
    </Animated.View>
  );
}

export default function NewsListView({ items, loading, error, onItemPress, onRefresh }) {
  const [filter, setFilter] = useState(ALL);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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
    const byCat = filter === ALL ? items : items.filter((item) => (item.category || 'Macro') === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter((item) => {
      const title = String(item.title || '').toLowerCase();
      const source = String(item.source || '').toLowerCase();
      return title.includes(q) || source.includes(q);
    });
  }, [items, filter, query]);

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

  if (flatList.length === 0) {
    const q = query.trim();
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
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip.label}</Text>
                <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>{chip.count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Không có tin khớp</Text>
          <Text style={styles.errorBody}>
            {q
              ? `Không tìm thấy tin nào khớp "${q}". Thử từ khóa khác hoặc đổi category.`
              : 'Category này hiện chưa có tin nào.'}
          </Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              setFilter(ALL);
              setQuery('');
            }}
          >
            <Text style={styles.retryText}>Xem tất cả tin</Text>
          </TouchableOpacity>
        </View>
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
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip.label}</Text>
              <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>{chip.count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <View style={styles.searchIconWrap}>
          <SearchIcon size={16} color={searchFocused ? COLORS.primary : COLORS.textMuted} strokeWidth={2} />
        </View>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Tìm tin theo từ khóa hoặc nguồn…"
          placeholderTextColor={COLORS.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <CloseIcon size={14} color={COLORS.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
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
        renderItem={({ item, index }) => (
          <NewsItem index={index} item={item} onPress={onItemPress} />
        )}
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
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderColor: 'rgba(245, 166, 35, 0.35)',
    shadowColor: '#F5A623',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  chipTextActive: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  chipCount: {
    marginLeft: 6,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  chipCountActive: {
    color: COLORS.primary,
    backgroundColor: 'rgba(245, 166, 35, 0.20)',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 40,
  },
  searchWrapFocused: {
    borderColor: 'rgba(245, 166, 35, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  searchIconWrap: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13.5,
    fontFamily: FONT_FAMILY,
    paddingVertical: 0,
  },
  content: {
    paddingVertical: 10,
    paddingBottom: 32,
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
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  skeletonColumn: {
    flex: 1,
  },
  shimmerSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonMeta: {
    marginTop: 12,
    height: 16,
    width: '45%',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  errorIcon: {
    fontSize: 36,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    fontFamily: FONT_FAMILY,
  },
  errorBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    fontFamily: FONT_FAMILY,
  },
  retry: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: COLORS.primaryText,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
});