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
import { COLORS, categoryStyle, FONT_FAMILY } from '../config/constants';
import TranslatedText from '../components/TranslatedText';

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
  const isGoogleNews = String(item.url || '').includes('news.google.com');

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang đọc nội dung...</Text>
      </View>
    );
  }

  if (isGoogleNews && (status === 'error' || (article && article.paragraphs.length === 0))) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>📰</Text>
        <Text style={styles.errorTitle}>Tin tổng hợp từ Google News</Text>
        <Text style={styles.errorBody}>
          Google chặn hiển thị nội dung bài này trong ứng dụng. Bấm mở tab bên dưới — trình duyệt
          sẽ tự chuyển tới trang nguồn gốc để bạn đọc bình thường.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onOpenOriginal}>
          <Text style={styles.primaryBtnText}>↗ Mở bài trên Google News</Text>
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
      <View style={styles.articleContainer}>
        {article.image ? (
          <Image source={{ uri: article.image }} style={styles.hero} resizeMode="cover" />
        ) : null}

        <View style={styles.metaRow}>
          <View style={[styles.categoryChip, { backgroundColor: cat.bg, borderColor: `${cat.color}35` }]}>
            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
            <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={styles.source}>{article.source || item.source}</Text>
        </View>

        <TranslatedText style={styles.title} text={article.title || item.title} />

        {article.description ? (
          <Text style={styles.deck}>{article.description}</Text>
        ) : null}

        {article.paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.footerLink} onPress={onOpenOriginal} activeOpacity={0.75}>
            <Text style={styles.footerLinkText}>↗ Mở trang gốc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerLink, isBookmarked && styles.footerLinkActive]}
            onPress={onToggleBookmark}
            activeOpacity={0.75}
          >
            <Text style={[styles.footerLinkText, isBookmarked && { color: COLORS.primary }]}>
              {isBookmarked ? '★ Đã lưu' : '☆ Lưu bài'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </View>
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
    fontFamily: FONT_FAMILY,
  },
  errorIcon: {
    fontSize: 38,
  },
  errorTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  errorBody: {
    color: COLORS.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    fontFamily: FONT_FAMILY,
    maxWidth: 480,
  },
  primaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.40)',
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13.5,
    fontFamily: FONT_FAMILY,
  },
  ghostBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  ghostBtnActive: {
    borderColor: 'rgba(245, 166, 35, 0.35)',
    backgroundColor: 'rgba(245, 166, 35, 0.10)',
  },
  ghostBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  reader: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  readerContent: {
    paddingBottom: 24,
  },
  articleContainer: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: FONT_FAMILY,
  },
  source: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 10,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 23,
    lineHeight: 33,
    fontWeight: '700',
    marginTop: 12,
    fontFamily: FONT_FAMILY,
    letterSpacing: -0.2,
  },
  deck: {
    color: '#CBD5E1',
    fontSize: 15.5,
    lineHeight: 24,
    marginTop: 14,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY,
    borderLeftWidth: 2.5,
    borderLeftColor: 'rgba(245, 166, 35, 0.50)',
    paddingLeft: 12,
  },
  paragraph: {
    color: '#E2E8F0',
    fontSize: 15.5,
    lineHeight: 27,
    marginTop: 16,
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  footerLink: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  footerLinkActive: {
    borderColor: 'rgba(245, 166, 35, 0.35)',
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  footerLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});