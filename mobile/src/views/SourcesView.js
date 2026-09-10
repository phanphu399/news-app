import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import NewsCard from './NewsCard';
import { fetchSources, sourcesFromItems, addUserFeed, removeUserFeed } from '../services/SourceService';
import { COLORS, categoryStyle } from '../config/constants';

function SourceAvatar({ source }) {
  const initial = (source || '?').charAt(0).toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

function SourceCard({ sourceItem, onPress, onRemove, removing }) {
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
          {sourceItem.userFeedId ? (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={onRemove}
              disabled={removing}
              hitSlop={8}
            >
              <Text style={styles.removeBtnText}>{removing ? '…' : '✕'}</Text>
            </TouchableOpacity>
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
          {sourceItem.userFeedId ? <Text style={styles.userTag}>NGUỒN CỦA BẠN · </Text> : null}
          <Text style={styles.url} numberOfLines={1}>
            {sourceItem.url || 'Đang tổng hợp...'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const CATEGORY_OPTIONS = [
  { key: 'Custom', label: 'Tin của bạn' },
  { key: 'Macro', label: 'Kinh tế vĩ mô' },
  { key: 'XAUUSD', label: 'Vàng & Dầu' },
];

export default function SourcesView({ items, onOpenArticle }) {
  const [sources, setSources] = useState(null);
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedCategory, setFeedCategory] = useState('Custom');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [removingId, setRemovingId] = useState(null);

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

  const submitFeed = async () => {
    setFormError('');
    if (!feedName.trim()) {
      setFormError('Vui lòng đặt tên cho nguồn.');
      return;
    }
    if (!feedUrl.trim()) {
      setFormError('Vui lòng nhập link RSS.');
      return;
    }
    setSubmitting(true);
    try {
      await addUserFeed({ name: feedName.trim(), rssUrl: feedUrl.trim(), category: feedCategory });
      setShowAdd(false);
      setFeedName('');
      setFeedUrl('');
      setFeedCategory('Custom');
      refresh();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const removeFeed = async (item) => {
    setRemovingId(item.userFeedId);
    try {
      await removeUserFeed(item.userFeedId);
      refresh();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setRemovingId(null);
    }
  };

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
        keyExtractor={(item) => item.userFeedId || item.source}
        contentContainerStyle={styles.mainList}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>CÁC NGUỒN ĐANG THEO DÕI</Text>
            <Text style={styles.sectionHint}>
              Bấm vào một nguồn để xem các bài của nguồn đó. Trạng thái "Lỗi" nghĩa là nguồn vừa
              từ chối kết nối trong lần kiểm tra gần nhất.
            </Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
              <Text style={styles.addBtnIcon}>＋</Text>
              <Text style={styles.addBtnText}>Thêm nguồn tin của bạn</Text>
            </TouchableOpacity>
            {status === 'offline' && (
              <TouchableOpacity style={styles.offlineBar} onPress={refresh}>
                <Text style={styles.offlineText}>↻ Không tải được backend — hiển thị dữ liệu cục bộ. Bấm thử lại.</Text>
              </TouchableOpacity>
            )}
          </>
        }
        renderItem={({ item }) => (
          <SourceCard
            sourceItem={item}
            onPress={() => setSelected(item)}
            onRemove={() => removeFeed(item)}
            removing={removingId === item.userFeedId}
          />
        )}
      />
      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm nguồn tin mới</Text>
            <Text style={styles.modalHint}>
              Dán link RSS/Atom của trang web bạn muốn theo dõi. Hệ thống sẽ xác thực feed, sau đó
              cron cào bài và đưa vào danh sách tin (cập nhật sau vài phút).
            </Text>

            <Text style={styles.fieldLabel}>Tên nguồn *</Text>
            <TextInput
              style={styles.input}
              value={feedName}
              onChangeText={setFeedName}
              placeholder="VD: Bộ Tài chính Mỹ"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.fieldLabel}>Link RSS *</Text>
            <TextInput
              style={styles.input}
              value={feedUrl}
              onChangeText={setFeedUrl}
              placeholder="https://example.com/feed/"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.fieldLabel}>Chuyên mục</Text>
            <View style={styles.catRow}>
              {CATEGORY_OPTIONS.map((option) => {
                const active = feedCategory === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.catBtn, active && styles.catBtnActive]}
                    onPress={() => setFeedCategory(option.key)}
                  >
                    <Text style={[styles.catBtnText, active && styles.catBtnTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
                onPress={submitFeed}
                disabled={submitting}
              >
                <Text style={styles.saveBtnText}>
                  {submitting ? 'Đang kiểm tra feed...' : 'Thêm nguồn'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 11,
    marginBottom: 12,
  },
  addBtnIcon: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 7,
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
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
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(244,63,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  userTag: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  modalHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
    marginBottom: 14,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.text,
    fontSize: 14,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.surfaceAlt,
    marginRight: 8,
    marginBottom: 6,
  },
  catBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  catBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  catBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  formError: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: COLORS.surfaceAlt,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
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