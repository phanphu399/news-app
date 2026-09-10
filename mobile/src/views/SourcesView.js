import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import NewsCard from './NewsCard';
import { fetchSources, sourcesFromItems } from '../services/SourceService';
import { COLORS, categoryStyle } from '../config/constants';

function SourceAvatar({ source }) {
  const initial = (source || '?').charAt(0).toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

function SourceCard({ sourceItem, onPress }) {
  const healthy = sourceItem.healthy;
  return (
    <TouchableOpacity style={styles.sourceCard} activeOpacity={0.8} onPress={onPress}>
      <SourceAvatar source={sourceItem.source} />
      <View style={styles.sourceBody}>
        <View style={styles.sourceTop}>
          <Text style={styles.sourceName} numberOfLines={1}>
            {sourceItem.source}
          </Text>
          {healthy !== null ? (
            <View style={[styles.badge, healthy ? styles.badgeOk : styles.badgeErr]}>
              <View style={[styles.badgeDot, { backgroundColor: healthy ? COLORS.success : COLORS.danger }]} />
              <Text style={[styles.badgeText, { color: healthy ? COLORS.success : COLORS.danger }]}>
                {healthy ? 'Hoạt động' : 'Lỗi'}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.chipRow}>
          {sourceItem.categories.map((category) => {
            const style = categoryStyle(category);
            return (
              <View key={category} style={[styles.chip, { borderColor: style.color, backgroundColor: style.bg }]}>
                <Text style={[styles.chipText, { color: style.color }]}>{style.label}</Text>
              </View>
            );
          })}
          <Text style={styles.count}>{sourceItem.count24h} bài / 24h</Text>
        </View>

        <View style={styles.urlRow}>
          <Text style={styles.url} numberOfLines={1}>
            {sourceItem.url || 'Đang tổng hợp...'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SourcesView({ items, onOpenArticle }) {
  const [sources, setSources] = useState(null);
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchSources()
      .then((list) => {
        if (cancelled) return;
        setSources(list);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setSources(sourcesFromItems(items));
        setStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, items]);

  const selectedPosts = useMemo(() => {
    if (!selected) return [];
    return items.filter((item) => (item.source || 'Unknown') === selected.source);
  }, [selected, items]);

  const refresh = () => setRefreshKey((key) => key + 1);

  if (selected) {
    return (
      <View style={styles.flex}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)} hitSlop={8}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.detailTitleWrap}>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {selected.source}
            </Text>
            <Text style={styles.detailSub}>{selectedPosts.length} bài trong 24h qua</Text>
          </View>
        </View>
        <FlatList
          data={selectedPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.detailList}
          renderItem={({ item }) => <NewsCard item={item} onPress={onOpenArticle} />}
          ListEmptyComponent={
            <View style={styles.centerFull}>
              <Text style={styles.emptyIcon}>🕳️</Text>
              <Text style={styles.emptyTitle}>Chưa có bài của nguồn này</Text>
              <Text style={styles.emptyHint}>Cron sẽ cập nhật khi có tin mới — kéo để thử lại.</Text>
            </View>
          }
        />
      </View>
    );
  }

  if (status === 'loading' && !sources) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang kiểm tra các nguồn tin...</Text>
      </View>
    );
  }

  const list = sources || [];

  return (
    <View style={styles.flex}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.source}
        contentContainerStyle={styles.mainList}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>CÁC NGUỒN ĐANG THEO DÕI</Text>
            <Text style={styles.sectionHint}>
              Danh sách các nguồn RSS đang được cào bởi backend. Bấm vào một nguồn để xem các bài
              của nguồn đó. Trạng thái "Lỗi" nghĩa là nguồn vừa từ chối kết nối trong lần kiểm tra
              gần nhất.
            </Text>
            {status === 'offline' && (
              <TouchableOpacity style={styles.offlineBar} onPress={refresh}>
                <Text style={styles.offlineText}>↻ Không tải được backend — hiển thị dữ liệu cục bộ. Bấm thử lại.</Text>
              </TouchableOpacity>
            )}
          </>
        }
        renderItem={({ item }) => (
          <SourceCard sourceItem={item} onPress={() => setSelected(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 13,
  },
  mainList: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 4,
  },
  sectionHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    marginLeft: 4,
  },
  offlineBar: {
    backgroundColor: 'rgba(244,63,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.4)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  offlineText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  sourceCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '900',
  },
  sourceBody: { flex: 1 },
  sourceTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
  },
  badgeOk: { backgroundColor: 'rgba(52,211,153,0.12)' },
  badgeErr: { backgroundColor: 'rgba(244,63,94,0.12)' },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  count: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },
  url: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 18,
    marginLeft: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  detailTitleWrap: { flex: 1 },
  detailTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  detailSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  detailList: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  emptyIcon: { fontSize: 34 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});