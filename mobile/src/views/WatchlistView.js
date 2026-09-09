import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import NewsCard from './NewsCard';
import { COLORS } from '../config/constants';

function matchKeyword(item, keyword) {
  const text = `${item.title || ''} ${item.titleVi || ''} ${item.source || ''}`.toLowerCase();
  return text.includes(keyword.toLowerCase());
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

  return (
    <View style={styles.flex}>
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>THEO DÕI TỪ KHÓA</Text>
              <Text style={styles.sectionHint}>
                Nhập từ khóa như "fed", "opec", "vàng" — tin trùng sẽ hiện ngay dưới đây và khoanh
                sáng trên danh sách tin.
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={submitKeyword}
                  placeholder="Từ khóa..."
                  placeholderTextColor={COLORS.textMuted}
                  returnKeyType="done"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.addBtn} onPress={submitKeyword}>
                  <Text style={styles.addBtnText}>Thêm</Text>
                </TouchableOpacity>
              </View>
              {keywords.length > 0 && (
                <View style={styles.chips}>
                  {keywords.map((keyword) => (
                    <TouchableOpacity
                      key={keyword}
                      style={styles.chip}
                      onPress={() => onRemoveKeyword(keyword)}
                    >
                      <Text style={styles.chipText}>{keyword}</Text>
                      <Text style={styles.chipX}>✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                TIN KHỚP TỪ KHÓA {matched.length > 0 ? `(${matched.length})` : ''}
              </Text>
              {keywords.length === 0 ? (
                <Text style={styles.emptyHint}>Chưa có từ khóa nào — thêm vào để lọc tin.</Text>
              ) : matched.length === 0 ? (
                <Text style={styles.emptyHint}>Chưa có tin nào khớp từ khóa của bạn.</Text>
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
                <Text style={styles.emptyHint}>
                  Bấm "☆ Lưu bài" khi đang đọc một tin để đọc lại ở đây.
                </Text>
              ) : (
                bookmarks.map((item) => (
                  <View key={item.id}>
                    <NewsCard item={item} onPress={onOpenArticle} />
                    <TouchableOpacity
                      style={styles.removeBookmark}
                      onPress={() => onToggleBookmark(item.id)}
                    >
                      <Text style={styles.removeBookmarkText}>✕ Bỏ lưu</Text>
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
  section: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  addBtn: {
    marginLeft: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: COLORS.primaryText,
    fontWeight: '800',
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
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
  },
  chipX: {
    color: COLORS.textMuted,
    marginLeft: 8,
    fontSize: 12,
  },
  emptyHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: 8,
  },
  removeBookmark: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: -4,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBookmarkText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});