import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Switch,
  StyleSheet,
} from 'react-native';
import NewsCard from './NewsCard';
import {
  fetchSources,
  sourcesFromItems,
  addUserFeed,
  updateUserFeed,
  removeUserFeed,
  testUserFeed,
} from '../services/SourceService';
import { COLORS, categoryStyle } from '../config/constants';
import { faviconUrl } from '../utils/domain';
import { showToast } from '../services/ToastService';

function SourceAvatar({ sourceItem }) {
  const favicon = faviconUrl(sourceItem.source, sourceItem.url);
  if (favicon) {
    return <Image source={{ uri: favicon }} style={styles.avatar} />;
  }
  const initial = (sourceItem.source || '?').charAt(0).toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

function SourceCard({ sourceItem, onPress, onRemove, onEdit, onToggle, removing }) {
  const healthy = sourceItem.healthy;
  return (
    <TouchableOpacity style={styles.sourceCard} activeOpacity={0.8} onPress={onPress}>
      <SourceAvatar sourceItem={sourceItem} />
      <View style={styles.sourceBody}>
        <View style={styles.sourceTop}>
          <Text style={styles.sourceName} numberOfLines={1}>
            {sourceItem.source}
          </Text>
          {sourceItem.userFeedId ? (
            <>
              <Text style={styles.userTag}>BẠN</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={onEdit}
                hitSlop={8}
                accessibilityLabel="Chỉnh sửa nguồn"
              >
                <Text style={styles.editBtnText}>✎</Text>
              </TouchableOpacity>
            </>
          ) : null}
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
          <Text style={styles.chevron}>›</Text>
        </View>

        {sourceItem.userFeedId ? (
          <View style={styles.feedActions}>
            <Text style={styles.toggleLabel}>
              {sourceItem.enabled ? 'Đang theo dõi' : 'Đã tạm dừng'}
            </Text>
            <Switch
              value={Boolean(sourceItem.enabled)}
              onValueChange={(value) => onToggle?.(value)}
              trackColor={{ false: COLORS.surfaceAlt, true: 'rgba(52,211,153,0.5)' }}
              thumbColor={sourceItem.enabled ? COLORS.success : COLORS.textMuted}
            />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const CATEGORY_OPTIONS = [
  { key: 'Custom', label: 'Tin của bạn' },
  { key: 'Macro', label: 'Kinh tế vĩ mô' },
  { key: 'XAUUSD', label: 'Vàng & Dầu' },
  { key: 'Forex', label: 'Ngoại tệ' },
  { key: 'Crypto', label: 'Tiền số' },
  { key: 'Geopolitics', label: 'Địa chính trị' },
];

export default function SourcesView({ items, onOpenArticle }) {
  const [sources, setSources] = useState(null);
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedCategory, setFeedCategory] = useState('Custom');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [patchingId, setPatchingId] = useState(null);

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

  const openAddModal = () => {
    setEditingId(null);
    setFeedName('');
    setFeedUrl('');
    setFeedCategory('Custom');
    setFormError('');
    setTestResult(null);
    setShowAdd(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.userFeedId);
    setFeedName(item.source || '');
    setFeedUrl(item.url || '');
    setFeedCategory(item.categories?.[0] || 'Custom');
    setFormError('');
    setTestResult(null);
    setShowAdd(true);
  };

  const testFeed = async () => {
    setFormError('');
    if (!feedUrl.trim()) {
      setFormError('Vui lòng nhập link RSS để kiểm tra.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testUserFeed(feedUrl.trim());
      setTestResult(result);
      if (result?.valid) {
        showToast({ type: 'success', title: 'Cào thử thành công' });
      } else {
        showToast({ type: 'warning', title: result?.message || 'Không cào được bài nào' });
      }
    } catch (error) {
      setTestResult({ ok: true, valid: false, message: error.message, items: [] });
      showToast({ type: 'error', title: 'Kiểm tra feed thất bại', message: error.message });
    } finally {
      setTesting(false);
    }
  };

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
      if (editingId) {
        await updateUserFeed(editingId, {
          name: feedName.trim(),
          rssUrl: feedUrl.trim(),
          category: feedCategory,
        });
        showToast({ type: 'success', title: 'Đã cập nhật nguồn tin', message: feedName.trim() });
      } else {
        await addUserFeed({ name: feedName.trim(), rssUrl: feedUrl.trim(), category: feedCategory });
        showToast({ type: 'success', title: 'Đã thêm nguồn tin', message: feedName.trim() });
      }
      setShowAdd(false);
      refresh();
    } catch (error) {
      setFormError(error.message);
      showToast({ type: 'error', title: 'Lưu nguồn tin thất bại', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const removeFeed = async (item) => {
    setRemovingId(item.userFeedId);
    try {
      await removeUserFeed(item.userFeedId);
      showToast({ type: 'info', title: 'Đã xóa nguồn tin', message: item.source });
      refresh();
    } catch (error) {
      showToast({ type: 'error', title: 'Xóa nguồn tin thất bại', message: error.message });
    } finally {
      setRemovingId(null);
    }
  };

  const toggleFeed = async (value, item) => {
    setPatchingId(item.userFeedId);
    try {
      await updateUserFeed(item.userFeedId, { enabled: value });
      setSources((prev) =>
        (prev || []).map((entry) =>
          entry.userFeedId === item.userFeedId ? { ...entry, enabled: value } : entry
        )
      );
      showToast({
        type: value ? 'success' : 'warning',
        title: value ? 'Đã bật theo dõi nguồn' : 'Đã tạm dừng nguồn',
        message: item.source,
      });
      refresh();
    } catch (error) {
      showToast({ type: 'error', title: 'Cập nhật trạng thái thất bại', message: error.message });
    } finally {
      setPatchingId(null);
    }
  };

  const copyUrl = (url) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url || '').catch(() => {});
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
        {selected.url ? (
          <View style={styles.detailUrlRow}>
            <Text style={styles.detailUrl} numberOfLines={1}>
              {selected.url}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={() => copyUrl(selected.url)} hitSlop={8}>
              <Text style={styles.copyBtnText}>Sao chép</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
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
            onEdit={() => openEditModal(item)}
            onToggle={(value) => toggleFeed(value, item)}
            removing={removingId === item.userFeedId || patchingId === item.userFeedId}
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
            <Text style={styles.modalTitle}>
              {editingId ? 'Chỉnh sửa nguồn tin' : 'Thêm nguồn tin mới'}
            </Text>
            <Text style={styles.modalHint}>
              Dán link RSS/Atom của trang web bạn muốn theo dõi. Bấm "Cào thử" để kiểm tra feed lấy
              được tin không, rồi mới lưu.
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
            <View style={styles.urlInputRow}>
              <TextInput
                style={[styles.input, styles.urlInput]}
                value={feedUrl}
                onChangeText={(value) => {
                  setFeedUrl(value);
                  setTestResult(null);
                }}
                placeholder="https://example.com/feed/"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                style={[styles.testBtn, testing && styles.saveBtnDisabled]}
                onPress={testFeed}
                disabled={testing}
              >
                {testing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>Cào thử</Text>
                )}
              </TouchableOpacity>
            </View>

            {testResult ? (
              testResult.valid ? (
                <View style={styles.testOk}>
                  <Text style={styles.testOkTitle}>
                    ✓ {testResult.items?.length || 0} bài mẫu:
                  </Text>
                  {(testResult.items || []).slice(0, 3).map((sample, index) => (
                    <Text key={`${index}-${sample.title}`} style={styles.testOkItem} numberOfLines={1}>
                      • {sample.title}
                    </Text>
                  ))}
                </View>
              ) : (
                <View style={styles.testErr}>
                  <Text style={styles.testErrText}>{testResult.message}</Text>
                </View>
              )
            ) : null}

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
                  {submitting
                    ? 'Đang lưu...'
                    : editingId
                    ? 'Lưu thay đổi'
                    : 'Thêm nguồn'}
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
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.surfaceAlt,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  avatarText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '800',
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
  editBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(56,189,248,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },
  toggleLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  userTag: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  detailUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    backgroundColor: COLORS.surface,
  },
  detailUrl: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  copyBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
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
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlInput: {
    flex: 1,
  },
  testBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  testBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  testOk: {
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  testOkTitle: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  testOkItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  testErr: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.4)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  testErrText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
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