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
        <Text style={styles.loadingText}>Äang Ä‘á»c ná»™i dung...</Text>
      </View>
    );
  }

  if (isGoogleNews && (status === 'error' || (article && article.paragraphs.length === 0))) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>ðŸ“°</Text>
        <Text style={styles.errorTitle}>Tin tá»•ng há»£p tá»« Google News</Text>
        <Text style={styles.errorBody}>
          Google cháº·n hiá»ƒn thá»‹ ná»™i dung bÃ i nÃ y trong á»©ng dá»¥ng. Báº¥m má»Ÿ tab bÃªn dÆ°á»›i â€” trÃ¬nh duyá»‡t
          sáº½ tá»± chuyá»ƒn tá»›i trang nguá»“n gá»‘c Ä‘á»ƒ báº¡n Ä‘á»c bÃ¬nh thÆ°á»ng.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onOpenOriginal}>
          <Text style={styles.primaryBtnText}>â†— Má»Ÿ bÃ i trÃªn Google News</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostBtn, isBookmarked && styles.ghostBtnActive]}
          onPress={onToggleBookmark}
        >
          <Text style={styles.ghostBtnText}>
            {isBookmarked ? 'â˜… ÄÃ£ lÆ°u' : 'â˜† LÆ°u láº¡i Ä‘á»ƒ Ä‘á»c sau'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'error' || !article || article.paragraphs.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>ðŸ”’</Text>
        <Text style={styles.errorTitle}>Trang khÃ´ng cho Ä‘á»c nhÃºng</Text>
        <Text style={styles.errorBody}>
          {item.source || 'Trang nguá»“n'} cháº·n hiá»ƒn thá»‹ ná»™i dung trong á»©ng dá»¥ng (refused to connect).
          Báº¥m nÃºt bÃªn dÆ°á»›i Ä‘á»ƒ má»Ÿ bÃ i viáº¿t gá»‘c á»Ÿ tab riÃªng.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onOpenOriginal}>
          <Text style={styles.primaryBtnText}>â†— Má»Ÿ bÃ i viáº¿t gá»‘c</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostBtn, isBookmarked && styles.ghostBtnActive]}
          onPress={onToggleBookmark}
        >
          <Text style={styles.ghostBtnText}>
            {isBookmarked ? 'â˜… ÄÃ£ lÆ°u' : 'â˜† LÆ°u láº¡i Ä‘á»ƒ Ä‘á»c sau'}
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
        <View style={styles.categoryChip}>
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

      <Text style={styles.skeletonTrail}>â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€</Text>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.footerLink} onPress={onOpenOriginal}>
          <Text style={styles.footerLinkText}>â†— Má»Ÿ trang gá»‘c</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerLink} onPress={onToggleBookmark}>
          <Text style={styles.footerLinkText}>{isBookmarked ? 'â˜… ÄÃ£ lÆ°u' : 'â˜† LÆ°u bÃ i'}</Text>
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
    backgroundColor: 'rgba(245,166,35,0.10)',
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
  },
  reader: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  catDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 11,
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
    fontFamily: FONT_FAMILY,
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