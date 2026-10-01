import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import { formatRelativeTime } from '../utils/time_format';
import { categoryStyle, COLORS, FONT_FAMILY, TABULAR_NUMS, FONT_MONO } from '../config/constants';
import TranslatedText from '../components/TranslatedText';

// Helper to generate a monogram from source name
function monogram(source) {
  const s = String(source || '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/);
  if (parts.length === 1) return s.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Animation when card first appears
function useEnterAnimation(index) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    const delay = Math.min(index * 40, 400);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return { opacity, translateY };
}

// Glow effect for realtime new items
function useNewItemGlow(isNew) {
  const glow = useRef(new Animated.Value(isNew ? 1 : 0)).current;
  useEffect(() => {
    if (!isNew) return;
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 0, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();
  }, [isNew]);
  return glow;
}

export const NewsCard = memo(function NewsCard({ item, onPress, dimmed, index = 0, isNew = false }) {
  const isImportant = Boolean(item.isImportant);
  const cat = categoryStyle(item.category);
  const { opacity, translateY } = useEnterAnimation(index);
  const glow = useNewItemGlow(isNew);

  // Press scale animation
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start();

  const glowBg = glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0, 212, 255, 0)', 'rgba(0, 212, 255, 0.06)'] });

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }, { scale }] }, dimmed && styles.cardDimmed]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress?.(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <Animated.View style={[styles.card, isImportant && styles.cardImportant, { backgroundColor: glowBg }]}>
          {/* Left accent border for important items */}
          {isImportant && <View style={[styles.accentBar, { backgroundColor: COLORS.important }]} />}

          <View style={styles.body}>
            {item.thumbnailUrl && (
              <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
            )}
            <View style={styles.textContainer}>
              {/* Category + hot badge */}
              <View style={styles.topRow}>
                <View style={[styles.catBadge, { backgroundColor: cat.bg, borderColor: cat.border || `${cat.color}30` }]} >
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.catText, { color: cat.color }]} numberOfLines={1}>
                    {cat.short}
                  </Text>
                </View>
                {isImportant && (
                  <View style={styles.hotBadge}>
                    <HotPulse />
                    <Text style={styles.hotText}>NÓNG</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <TranslatedText
                style={[styles.title, isImportant && styles.titleImportant]}
                numberOfLines={2}
                text={item.title}
              />

              {/* Meta */}
              <View style={styles.metaRow}>
                <View style={styles.monogram}>
                  <Text style={styles.monogramText}>{monogram(item.source)}</Text>
                </View>
                <Text style={styles.source} numberOfLines={1}>
                  {item.source || 'Unknown'}
                </Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.time}>{formatRelativeTime(item.publishedAt)}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Hot badge pulse animation
function HotPulse() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.hotDotWrap}>
      <Animated.View style={[styles.hotDotRing, { transform: [{ scale: pulse }] }]} />
      <View style={styles.hotDot} />
    </View>
  );
}

export default NewsCard;

const styles = StyleSheet.create({
  touchable: { overflow: 'hidden' },
  card: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)', paddingVertical: 10, paddingRight: 12, paddingLeft: 0, marginHorizontal: 0, position: 'relative', overflow: 'hidden' },
  cardImportant: { borderBottomColor: 'rgba(255, 59, 92, 0.25)', backgroundColor: 'rgba(255, 59, 92, 0.02)' },
  cardDimmed: { opacity: 0.5 },
  accentBar: { width: 2, alignSelf: 'stretch', marginRight: 10, marginLeft: 12, opacity: 1 },
  body: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, paddingLeft: 12, marginBottom: 0 },
  thumbnail: { width: 48, height: 48, borderRadius: 2, marginRight: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  textContainer: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  catBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1 },
  catDot: { display: 'none' },
  catText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT_FAMILY },
  hotBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 1, gap: 4 },
  hotDotWrap: { width: 6, height: 6, alignItems: 'center', justifyContent: 'center' },
  hotDotRing: { display: 'none' },
  hotDot: { width: 4, height: 4, backgroundColor: '#FF3B5C' },
  hotText: { color: '#FF3B5C', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, fontFamily: FONT_MONO },
  title: { color: '#E2E8F0', fontSize: 13, lineHeight: 18, fontWeight: '400', fontFamily: FONT_FAMILY },
  titleImportant: { fontWeight: '600', color: '#FFFFFF' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  monogram: { display: 'none' },
  monogramText: { display: 'none' },
  source: { color: '#64748B', fontSize: 10, fontWeight: '700', flexShrink: 1, fontFamily: FONT_FAMILY, letterSpacing: 0.5, textTransform: 'uppercase' },
  dot: { color: '#334155', fontSize: 10, marginHorizontal: 6 },
  time: { color: '#64748B', fontSize: 10, fontFamily: FONT_MONO, fontVariant: TABULAR_NUMS },
});