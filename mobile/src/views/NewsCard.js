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
          <View style={styles.timeCol}>
            <Text style={styles.timeText}>{formatRelativeTime(item.publishedAt)}</Text>
            <View style={[styles.catBadge, { borderColor: cat.border || `${cat.color}40`, backgroundColor: cat.bg }]}>
              <Text style={[styles.catText, { color: cat.color }]} numberOfLines={1}>{cat.short}</Text>
            </View>
            {isImportant && (
              <View style={styles.hotBadge}>
                <Text style={styles.hotText}>NÓNG</Text>
              </View>
            )}
          </View>

          <View style={styles.contentCol}>
            <Text style={styles.source} numberOfLines={1}>{item.source || 'Unknown'}</Text>
            <TranslatedText
              style={[styles.title, isImportant && styles.titleImportant]}
              numberOfLines={3}
              text={item.title}
            />
            {item.thumbnailUrl && (
              <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default NewsCard;

const styles = StyleSheet.create({
  touchable: { overflow: 'visible' },
  card: { 
    flexDirection: 'row', 
    paddingVertical: 14, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.05)', 
    backgroundColor: 'transparent'
  },
  cardImportant: { 
    backgroundColor: 'rgba(255, 59, 92, 0.03)',
    borderBottomColor: 'rgba(255, 59, 92, 0.2)'
  },
  cardDimmed: { opacity: 0.5 },
  timeCol: {
    width: 65,
    flexShrink: 0,
    alignItems: 'flex-start',
    marginRight: 12,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: FONT_MONO,
    fontVariant: TABULAR_NUMS,
    marginBottom: 6,
  },
  catBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 6,
  },
  catText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: FONT_MONO,
  },
  hotBadge: {
    backgroundColor: '#FF3B5C',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  hotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONT_MONO,
  },
  contentCol: {
    flex: 1,
  },
  source: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_MONO,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: '#E2E8F0',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
    fontFamily: FONT_FAMILY,
  },
  titleImportant: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});