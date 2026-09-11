import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Search, Sparkles } from 'lucide-react-native';
import { BookmarkIcon } from '../components/TabIcons';
import { XIcon } from '../components/UIIcons';
import NewsCard from './NewsCard';
import Card from '../components/Card';
import { COLORS, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';

const SUGGESTIONS = ['FED', 'Lãi suất', 'XAUUSD', 'Dầu thô'];

function matchKeyword(item, keyword) {
  const text = `${item.title || ''} ${item.source || ''}`.toLowerCase();
  return text.includes(keyword.toLowerCase());
}

function EmptyState({ icon: Icon, title }) {
  return (
    <View style={styles.emptyWrap}>
      <Icon size={30} strokeWidth={1.5} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );
}

export default function WatchlistView({
  items,
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  bookmarks,
  onToggleBookmark,
  onOpenArticle,
}) {
  const [draft, setDraft] = useState('');

  const matched = useMemo(() => {
    if (!keywords.length) return [];
    const seen = new Set();
    return keywords
      .flatMap((keyword) => items.filter((item) => matchKeyword(item, keyword)))
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 40);
  }, [items, keywords]);

  const submitKeyword = () => {
    const value = draft.trim();
    if (!value) return;
    onAddKeyword(value);
    setDraft('');
  };

  const missingSuggestions = SUGGESTIONS.filter((suggestion) => !keywords.includes(suggestion));

  return (
    <View style={styles.flex}>
      <FlatList
        data={[]}
ListHeaderComponent={
          <>
            <Card style={styles.keywordCard}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={submitKeyword}
                  placeholder="Thêm từ khóa..."
                  placeholderTextColor={COLORS.textMuted}
                  returnKeyType="done"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.addBtn} onPress={submitKeyword}>
                  <Sparkles size={16} strokeWidth={2} color={COLORS.primaryText} />
                  <Text style={styles.addBtnText}>Thêm</Text>
                </TouchableOpacity>
              </View>
              {missingSuggestions.length > 0 && (
                <View style={styles.suggestionWrap}>
                  {missingSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={styles.suggestionChip}
                      onPress={() => onAddKeyword(suggestion)}
                    >
                      <Text style={styles.suggestionPlus}>+</Text>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {keywords.length > 0 && (
                <View style={styles.chips}>
                  {keywords.map((keyword) => (
                    <TouchableOpacity
                      key={keyword}
                      style={styles.chip}
                      onPress={() => onRemoveKeyword(keyword)}
                    >
                      <Text style={styles.chipText}>{keyword}</Text>
                      <XIcon size={12} color={COLORS.textMuted} strokeWidth={2.2} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                TIN KHỚP TỪ KHÓA {matched.length > 0 ? `(${matched.length})` : ''}
              </Text>
              {keywords.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <EmptyState icon={Search} title="Thêm từ khóa để lọc tin" />
                </Card>
              ) : matched.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <EmptyState icon={Search} title="Chưa có tin khớp từ khóa" />
                </Card>
              ) : (
                matched.map((item) => (
                  <NewsCard key={item.id} item={item} onPress={onOpenArticle} />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                ĐÃ LƯU {bookmarks.length > 0 ? `(${bookmarks.length})` : ''}
              </Text>
              {bookmarks.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <EmptyState icon={BookmarkIcon} title="Chưa có tin lưu trữ" />
                </Card>
              ) : (
                bookmarks.map((item) => (
                  <View key={item.id}>
                    <NewsCard item={item} onPress={onOpenArticle} />
                    <TouchableOpacity
                      style={styles.removeBookmark}
                      onPress={() => onToggleBookmark(item)}
                    >
                      <XIcon size={13} color={COLORS.textMuted} strokeWidth={2.2} />
                      <Text style={styles.removeBookmarkText}>Bỏ lưu</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: 20 }} />
          </>
        }
        keyExtractor={() => 'watchlist'}
        renderItem={() => null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  keywordCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
  },
  section: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#12161F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  addBtn: {
    marginLeft: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtnText: {
    color: COLORS.primaryText,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    paddingLeft: 9,
    paddingRight: 11,
    paddingVertical: 6,
  },
  suggestionPlus: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  suggestionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginRight: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
    fontFamily: FONT_FAMILY,
  },
  removeBookmark: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: -4,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBookmarkText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});