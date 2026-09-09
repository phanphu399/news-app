import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { fetchArticle } from '../services/ReaderService';
import { COLORS, categoryStyle } from '../config/constants';

export default function NewsArticleView({ item, onOpenOriginal, onToggleBookmark, isBookmarked }) {
  const [status, setStatus] = useState('loading');
  const [article, setArticle] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchArticle(item.url)
      .then((data) => {
        if (cancelled) return;
        setArticle(data);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[reader]', error.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [item.url]);

  const cat = categoryStyle(item.category);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang đọc nội dung...</Text>
      </View>
    );
  }

  if (status === 'error' || !article || article.paragraphs.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Trang không cho đọc nhúng</Text>
        <Text style={styles.errorBody}>
          {item.source || 'Trang nguồn'} chặn hiển thị nội dung trong ứng dụng (refused to connect).
          Bấm nút bên dưới để mở bài viết gốc ở tab riêng.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onOpenOriginal}>
          <Text style={styles.primaryBtnText}>↗ Mở bài viết gốc</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostBtn, isBookmarked && styles.ghostBtnActive]}
          onPress={onToggleBookmark}
        >
          <Text style={styles.ghostBtnText}>
            {isBookmarked ? '★ Đã lưu' : '☆ Lưu lại để đọc sau'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.reader} contentContainerStyle={styles.readerContent}>
      {article.image ? (
        <Image source={{ uri: article.image }} style={styles.hero} resizeMode="cover" />
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.categoryChip, { borderColor: cat.color, backgroundColor: cat.bg }]}>
          <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
        </View>
        <Text style={styles.source}>{article.source || item.source}</Text>
      </View>

      <Text style={styles.title}>{article.title || item.titleVi || item.title}</Text>

      {article.description ? (
        <Text style={styles.deck}>{article.description}</Text>
      ) : null}

      {article.paragraphs.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      <Text style={styles.skeletonTrail}>────────────────────────────</Text>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.footerLink} onPress={onOpenOriginal}>
          <Text style={styles.footerLinkText}>↗ Mở trang gốc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerLink} onPress={onToggleBookmark}>
          <Text style={styles.footerLinkText}>{isBookmarked ? '★ Đã lưu' : '☆ Lưu bài'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 38,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  errorBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  primaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(56,189,248,0.1)',
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  ghostBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ghostBtnActive: {
    borderColor: COLORS.gold,
  },
  ghostBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  reader: {
    flex: 1,
    backgroundColor: '#0d1320',
  },
  readerContent: {
    paddingBottom: 12,
  },
  hero: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.surfaceAlt,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 18,
  },
  categoryChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  source: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 10,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    paddingHorizontal: 18,
    marginTop: 12,
  },
  deck: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 18,
    marginTop: 10,
    fontStyle: 'italic',
  },
  paragraph: {
    color: '#c3cfdf',
    fontSize: 15,
    lineHeight: 24,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  skeletonTrail: {
    color: COLORS.borderSoft,
    textAlign: 'center',
    marginTop: 22,
    fontSize: 12,
    letterSpacing: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    marginHorizontal: 18,
  },
  footerLink: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});