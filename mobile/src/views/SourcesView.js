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
import { COLORS, categoryStyle, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';
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
          {healthy !== null && (
            <View style={styles.health}>
              <View
                style={[
                  styles.healthDot,
                  { backgroundColor: healthy ? COLORS.success : COLORS.danger },
                ]}
              />
              {!healthy ? <Text style={styles.healthErrText}>Lá»—i</Text> : null}
            </View>
          )}
          {sourceItem.userFeedId ? (
            <>
              <View style={styles.userTagRow}>
                <View style={styles.userTagDot} />
                <Text style={styles.userTag}>Báº N</Text>
              </View>
              <TouchableOpacity
                style={styles.miniBtn}
                onPress={onEdit}
                hitSlop={8}
                accessibilityLabel="Chá»‰nh sá»­a nguá»“n"
              >
                <Text style={styles.miniBtnText}>âœŽ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.miniBtn, styles.miniBtnDanger]}
                onPress={onRemove}
                disabled={removing}
                hitSlop={8}
              >
                <Text style={styles.miniBtnTextDanger}>{removing ? 'â€¦' : 'âœ•'}</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <View style={styles.chipRow}>
          {sourceItem.categories.map((category) => {
            const label = categoryStyle(category).label;
            return (
              <View key={category} style={styles.chip}>
                <Text style={styles.chipText}>{label}</Text>
              </View>
            );
          })}
          <Text style={styles.count}>{sourceItem.count24h} bÃ i/24h</Text>
          <Text style={styles.chevron}>â€º</Text>
        </View>

        {sourceItem.userFeedId ? (
          <View style={styles.feedActions}>
            <Text style={styles.toggleLabel}>
              {sourceItem.enabled ? 'Äang theo dÃµi' : 'ÄÃ£ táº¡m dá»«ng'}
            </Text>
            <Switch
              value={Boolean(sourceItem.enabled)}
              onValueChange={(value) => onToggle?.(value)}
              trackColor={{ false: COLORS.surfaceAlt, true: 'rgba(52,211,153,0.45)' }}
              thumbColor={sourceItem.enabled ? COLORS.success : COLORS.textMuted}
            />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const CATEGORY_OPTIONS = [
  { key: 'Custom', label: 'Tin cá»§a báº¡n' },
  { key: 'Macro', label: 'Kinh táº¿ vÄ© mÃ´' },
  { key: 'XAUUSD', label: 'VÃ ng & Dáº§u' },
  { key: 'Forex', label: 'Ngoáº¡i tá»‡' },
  { key: 'Crypto', label: 'Tiá»n sá»‘' },
  { key: 'Geopolitics', label: 'Äá»‹a chÃ­nh trá»‹' },
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
      setFormError('Vui lÃ²ng nháº­p link RSS Ä‘á»ƒ kiá»ƒm tra.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testUserFeed(feedUrl.trim());
      setTestResult(result);
      if (result?.valid) {
        showToast({ type: 'success', title: 'CÃ o thá»­ thÃ nh cÃ´ng' });
      } else {
        showToast({ type: 'warning', title: result?.message || 'KhÃ´ng cÃ o Ä‘Æ°á»£c bÃ i nÃ o' });
      }
    } catch (error) {
      setTestResult({ ok: true, valid: false, message: error.message, items: [] });
      showToast({ type: 'error', title: 'Kiá»ƒm tra feed tháº¥t báº¡i', message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const submitFeed = async () => {
    setFormError('');
    if (!feedName.trim()) {
      setFormError('Vui lÃ²ng Ä‘áº·t tÃªn cho nguá»“n.');
      return;
    }
    if (!feedUrl.trim()) {
      setFormError('Vui lÃ²ng nháº­p link RSS.');
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
        showToast({ type: 'success', title: 'ÄÃ£ cáº­p nháº­t nguá»“n tin', message: feedName.trim() });
      } else {
        await addUserFeed({ name: feedName.trim(), rssUrl: feedUrl.trim(), category: feedCategory });
        showToast({ type: 'success', title: 'ÄÃ£ thÃªm nguá»“n tin', message: feedName.trim() });
      }
      setShowAdd(false);
      refresh();
    } catch (error) {
      setFormError(error.message);
      showToast({ type: 'error', title: 'LÆ°u nguá»“n tin tháº¥t báº¡i', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const removeFeed = async (item) => {
    setRemovingId(item.userFeedId);
    try {
      await removeUserFeed(item.userFeedId);
      showToast({ type: 'info', title: 'ÄÃ£ xÃ³a nguá»“n tin', message: item.source });
      refresh();
    } catch (error) {
      showToast({ type: 'error', title: 'XÃ³a nguá»“n tin tháº¥t báº¡i', message: error.message });
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
        title: value ? 'ÄÃ£ báº­t theo dÃµi nguá»“n' : 'ÄÃ£ táº¡m dá»«ng nguá»“n',
        message: item.source,
      });
      refresh();
    } catch (error) {
      showToast({ type: 'error', title: 'Cáº­p nháº­t tráº¡ng thÃ¡i tháº¥t báº¡i', message: error.message });
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
            <Text style={styles.backBtnText}>â†</Text>
          </TouchableOpacity>
          <View style={styles.detailTitleWrap}>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {selected.source}
            </Text>
            <Text style={styles.detailSub}>{selectedPosts.length} bÃ i trong 24h qua</Text>
          </View>
        </View>
        {selected.url ? (
          <View style={styles.detailUrlRow}>
            <Text style={styles.detailUrl} numberOfLines={1}>
              {selected.url}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={() => copyUrl(selected.url)} hitSlop={8}>
              <Text style={styles.copyBtnText}>Sao chÃ©p</Text>
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
              <Text style={styles.emptyIcon}>ðŸ•³ï¸</Text>
              <Text style={styles.emptyTitle}>ChÆ°a cÃ³ bÃ i cá»§a nguá»“n nÃ y</Text>
              <Text style={styles.emptyHint}>Cron sáº½ cáº­p nháº­t khi cÃ³ tin má»›i â€” kÃ©o Ä‘á»ƒ thá»­ láº¡i.</Text>
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
        <Text style={styles.loadingText}>Äang kiá»ƒm tra cÃ¡c nguá»“n tin...</Text>
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
            <Text style={styles.sectionTitle}>CÃC NGUá»’N ÄANG THEO DÃ•I</Text>
            <Text style={styles.sectionHint}>
              Báº¥m vÃ o má»™t nguá»“n Ä‘á»ƒ xem cÃ¡c bÃ i cá»§a nguá»“n Ä‘Ã³. Tráº¡ng thÃ¡i "Lá»—i" nghÄ©a lÃ  nguá»“n vá»«a
              tá»« chá»‘i káº¿t ná»‘i trong láº§n kiá»ƒm tra gáº§n nháº¥t.
            </Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
              <Text style={styles.addBtnIcon}>ï¼‹</Text>
              <Text style={styles.addBtnText}>ThÃªm nguá»“n tin cá»§a báº¡n</Text>
            </TouchableOpacity>
            {status === 'offline' && (
              <TouchableOpacity style={styles.offlineBar} onPress={refresh}>
                <Text style={styles.offlineText}>â†» KhÃ´ng táº£i Ä‘Æ°á»£c backend â€” hiá»ƒn thá»‹ dá»¯ liá»‡u cá»¥c bá»™. Báº¥m thá»­ láº¡i.</Text>
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
              {editingId ? 'Chá»‰nh sá»­a nguá»“n tin' : 'ThÃªm nguá»“n tin má»›i'}
            </Text>
            <Text style={styles.modalHint}>
              DÃ¡n link RSS/Atom cá»§a trang web báº¡n muá»‘n theo dÃµi. Báº¥m "CÃ o thá»­" Ä‘á»ƒ kiá»ƒm tra feed láº¥y
              Ä‘Æ°á»£c tin khÃ´ng, rá»“i má»›i lÆ°u.
            </Text>

            <Text style={styles.fieldLabel}>TÃªn nguá»“n *</Text>
            <TextInput
              style={styles.input}
              value={feedName}
              onChangeText={setFeedName}
              placeholder="VD: Bá»™ TÃ i chÃ­nh Má»¹"
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
                  <Text style={styles.testBtnText}>CÃ o thá»­</Text>
                )}
              </TouchableOpacity>
            </View>

            {testResult ? (
              testResult.valid ? (
                <View style={styles.testOk}>
                  <Text style={styles.testOkTitle}>
                    âœ“ {testResult.items?.length || 0} bÃ i máº«u:
                  </Text>
                  {(testResult.items || []).slice(0, 3).map((sample, index) => (
                    <Text key={`${index}-${sample.title}`} style={styles.testOkItem} numberOfLines={1}>
                      â€¢ {sample.title}
                    </Text>
                  ))}
                </View>
              ) : (
                <View style={styles.testErr}>
                  <Text style={styles.testErrText}>{testResult.message}</Text>
                </View>
              )
            ) : null}

            <Text style={styles.fieldLabel}>ChuyÃªn má»¥c</Text>
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
                <Text style={styles.cancelBtnText}>Há»§y</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
                onPress={submitFeed}
                disabled={submitting}
              >
                <Text style={styles.saveBtnText}>
                  {submitting
                    ? 'Äang lÆ°u...'
                    : editingId
                    ? 'LÆ°u thay Ä‘á»•i'
                    : 'ThÃªm nguá»“n'}
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
    fontFamily: FONT_FAMILY,
  },
  sectionHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    marginLeft: 4,
    fontFamily: FONT_FAMILY,
  },
  offlineBar: {
    backgroundColor: 'rgba(251,113,133,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.30)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  offlineText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 11,
    marginBottom: 12,
  },
  addBtnIcon: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '800',
    marginRight: 7,
  },
  addBtnText: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
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
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  sourceBody: { flex: 1 },
  sourceTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceName: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: '700',
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
  },
  health: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 6,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  healthErrText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: FONT_FAMILY,
  },
  miniBtn: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  miniBtnDanger: {
    backgroundColor: 'rgba(251,113,133,0.10)',
  },
  miniBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  miniBtnTextDanger: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  userTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 2,
  },
  userTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  userTag: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    fontWeight: '500',
    flex: 1,
    fontFamily: FONT_FAMILY,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
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
    backgroundColor: '#12161F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  testBtnText: {
    color: COLORS.primaryText,
    fontWeight: '800',
    fontSize: 12,
    fontFamily: FONT_FAMILY,
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
    backgroundColor: 'rgba(251,113,133,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.30)',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 8,
    marginBottom: 6,
  },
  catBtnActive: {
    borderColor: 'rgba(245,166,35,0.30)',
    backgroundColor: 'rgba(245,166,35,0.10)',
  },
  catBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  catBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
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
    color: COLORS.primaryText,
    fontWeight: '800',
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 6,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '500',
    letterSpacing: 0.3,
    fontFamily: FONT_FAMILY,
  },
  count: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 'auto',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
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