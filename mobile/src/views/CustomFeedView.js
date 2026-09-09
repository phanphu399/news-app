import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { CustomFeedService } from '../services/CustomFeedService';
import { formatRelativeTime } from '../utils/time_format';
import { COLORS } from '../config/constants';

function AddFeedForm({ onAdd }) {
  const [name, setName] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [open, setOpen] = useState(false);

  async function submit() {
    if (!name.trim() || !rssUrl.trim()) return;
    await onAdd(name.trim(), rssUrl.trim());
    setName('');
    setRssUrl('');
    setOpen(false);
  }

  if (!open) {
    return (
      <TouchableOpacity style={styles.addToggle} onPress={() => setOpen(true)}>
        <Text style={styles.addToggleIcon}>＋</Text>
        <Text style={styles.addToggleText}>Thêm nguồn RSS mới</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>THÊM NGUỒN RSS</Text>
        <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={styles.formClose}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Tên nguồn tin</Text>
      <TextInput
        style={styles.input}
        placeholder="VD: FxStreet Live"
        placeholderTextColor={COLORS.textMuted}
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.label}>RSS URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/feed.xml"
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        value={rssUrl}
        onChangeText={setRssUrl}
      />
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setOpen(false)}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, !(name.trim() && rssUrl.trim()) && styles.addButtonDisabled]}
          onPress={submit}
          disabled={!(name.trim() && rssUrl.trim())}
        >
          <Text style={styles.addButtonText}>Thêm nguồn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ArticleRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.articleRow} activeOpacity={0.7} onPress={() => onPress(item)}>
      <View style={styles.articleLine} />
      <View style={styles.articleBody}>
        <Text style={styles.articleTitle} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.articleMeta}>
          {item.source} · {formatRelativeTime(item.publishedAt)}
        </Text>
      </View>
      <Text style={styles.articleArrow}>›</Text>
    </TouchableOpacity>
  );
}

function FeedDetail({ feed, onBack, onOpenArticle }) {
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setArticles(await CustomFeedService.fetchFeed(feed));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [feed]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={8}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.detailTitleWrap}>
          <Text style={styles.detailTitle} numberOfLines={1}>
            {feed.name}
          </Text>
          <Text style={styles.detailUrl} numberOfLines={1}>
            {feed.rssUrl}
          </Text>
        </View>
        <TouchableOpacity style={styles.reloadButton} onPress={load} hitSlop={8}>
          <Text style={styles.reloadButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading && articles === null && (
        <View style={styles.detailCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.detailHint}>Đang tải bài viết...</Text>
        </View>
      )}

      {error && articles === null && (
        <View style={styles.detailCenter}>
          <Text style={styles.errorTitle}>Không tải được feed này</Text>
          <Text style={styles.detailHint}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {articles !== null && articles.length === 0 && (
        <View style={styles.detailCenter}>
          <Text style={styles.detailHint}>Feed này chưa có bài viết nào.</Text>
        </View>
      )}

      {articles && articles.length > 0 && (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => `${item.url || 'a'}-${index}`}
          contentContainerStyle={styles.articleList}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => <ArticleRow item={item} onPress={onOpenArticle} />}
        />
      )}
    </View>
  );
}

function FeedRow({ feed, onOpen, onRemove }) {
  return (
    <View style={styles.feedRow}>
      <TouchableOpacity style={styles.feedOpen} activeOpacity={0.7} onPress={() => onOpen(feed)}>
        <View style={styles.feedIcon}>
          <Text style={styles.feedIconText}>{feed.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.feedMeta}>
          <Text style={styles.feedName} numberOfLines={1}>
            {feed.name}
          </Text>
          <Text style={styles.feedUrl} numberOfLines={1}>
            {feed.rssUrl}
          </Text>
        </View>
        <Text style={styles.feedChevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(feed.id)} hitSlop={6}>
        <Text style={styles.removeButtonText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CustomFeedView({ onAdded, onOpenArticle }) {
  const [feeds, setFeeds] = useState([]);
  const [activeFeed, setActiveFeed] = useState(null);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    CustomFeedService.getUserFeeds().then(setFeeds).catch(() => setFeeds([]));
    setLoaded(true);
  }, []);

  async function addFeed(name, rssUrl) {
    const feed = await CustomFeedService.addUserFeed({ name, rssUrl, source: 'Custom' });
    setFeeds((prev) => [feed, ...prev]);
    onAdded?.();
  }

  async function removeFeed(id) {
    const next = await CustomFeedService.removeUserFeed(id);
    setFeeds(next);
    onAdded?.();
  }

  if (activeFeed) {
    return (
      <FeedDetail feed={activeFeed} onBack={() => setActiveFeed(null)} onOpenArticle={onOpenArticle} />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>NGUỒN TIN CỦA BẠN</Text>
        <Text style={styles.sectionCount}>{feeds.length} feed</Text>
      </View>

      <AddFeedForm onAdd={addFeed} />

      {loaded && feeds.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyTitle}>Chưa có nguồn tin nào</Text>
          <Text style={styles.emptyBody}>
            Thêm RSS theo dõi Forex, Macro hoặc bất kỳ chủ đề nào. Chạm vào nguồn để xem bài viết.
          </Text>
        </View>
      )}

      <FlatList
        data={feeds}
        keyExtractor={(feed) => feed.id}
        contentContainerStyle={styles.feedList}
        renderItem={({ item }) => (
          <FeedRow feed={item} onOpen={setActiveFeed} onRemove={removeFeed} />
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addToggleIcon: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 10,
  },
  addToggleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    padding: 14,
    marginBottom: 10,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  formTitle: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  formClose: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0e1521',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  addButton: {
    flex: 1.4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonText: {
    color: COLORS.primaryText,
    fontWeight: '800',
    fontSize: 13,
  },
  feedList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    marginBottom: 8,
    paddingRight: 12,
  },
  feedOpen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  feedIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  feedIconText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  feedMeta: {
    flex: 1,
  },
  feedName: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  feedUrl: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  feedChevron: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 4,
  },
  removeButton: {
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeButtonText: {
    color: '#fda4af',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyIcon: {
    fontSize: 38,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  backButton: {
    width: 38,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  detailTitleWrap: {
    flex: 1,
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  detailUrl: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  reloadButton: {
    width: 38,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  detailCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  detailHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  articleList: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
  },
  articleLine: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginRight: 12,
    opacity: 0.7,
  },
  articleBody: {
    flex: 1,
  },
  articleTitle: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  articleMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  articleArrow: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
});