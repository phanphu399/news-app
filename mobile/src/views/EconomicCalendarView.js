import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { COLORS, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';
import { BACKEND_URL } from '../config/constants';
import { showToast } from '../services/ToastService';
import localizeTitle, {
  localizeCountry,
  formatDateHeader,
  formatTime,
} from '../utils/calendarVi';

// Tailwind zinc/slate/amber/rose/emerald â€” packed sáºµn Ä‘á»ƒ dÃ¹ng trong StyleSheet (RN khÃ´ng cÃ³ Tailwind).
const Z = {
  zinc100: '#F4F4F5',
  zinc200: '#E4E4E7',
  zinc300: '#D4D4D8',
  zinc400: '#A1A1AA',
  zinc500: '#71717A',
  zinc600: '#52525B',
  zinc700: '#3F3F46',
  zinc800: '#27272A',
  rose400: '#FB7185',
  rose500: '#F43F5E',
  amber400: '#F5A623',
  emerald400: '#34D399',
};

const IMPACT_FILTERS = [
  { key: 'All', label: 'Táº¥t cáº£' },
  { key: 'High', label: 'Quan trá»ng' },
  { key: 'Medium', label: 'Trung bÃ¬nh' },
  { key: 'Low', label: 'Tháº¥p' },
];

// MÃ u active riÃªng tá»«ng nhÃ³m lá»c theo spec (bá» viá»n neon cÅ©).
const FILTER_ACTIVE_STYLES = {
  All: {
    backgroundColor: Z.zinc800,
    borderColor: 'rgba(255,255,255,0.10)',
    textColor: Z.zinc100,
  },
  High: {
    backgroundColor: 'rgba(244,63,94,0.15)',
    borderColor: 'rgba(244,63,94,0.30)',
    textColor: Z.rose400,
  },
  Medium: {
    backgroundColor: 'rgba(245,166,35,0.15)',
    borderColor: 'rgba(245,166,35,0.30)',
    textColor: Z.amber400,
  },
  Low: {
    backgroundColor: 'rgba(39,39,42,0.60)',
    borderColor: 'rgba(255,255,255,0.05)',
    textColor: Z.zinc400,
  },
};

function TimeoutWatch({ onTimeout }) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, 15000);
    return () => clearTimeout(timer);
  }, [onTimeout]);
  return null;
}

// Cá» "Actual tá»‘t hÆ¡n Dá»± bÃ¡o" cÃ³ tháº­t khÃ´ng â€” heuristic cho loáº¡i chá»‰ sá»‘ nghá»‹ch Ä‘áº£o.
function isDownsideGood(title) {
  return /unemploy|jobless|claims/i.test(String(title || ''));
}

function actualColor(actual, forecast, title) {
  const a = parseFloat(String(actual || '').replace(/,/g, ''));
  const f = parseFloat(String(forecast || '').replace(/,/g, ''));
  if (Number.isNaN(a) || Number.isNaN(f) || a === f) return null;
  const better = isDownsideGood(title) ? a < f : a > f;
  return better ? Z.emerald400 : Z.rose400;
}

// Thanh váº¡ch impact 1/2/3 (TradingView-style) thay cho badge chá»¯.
function ImpactIndicator({ impact }) {
  const level = impact === 'High' ? 3 : impact === 'Medium' ? 2 : 1;
  const color = level === 3 ? Z.rose500 : level === 2 ? Z.amber400 : Z.zinc600;
  return (
    <View style={styles.impactCol} accessibilityLabel={`Impact ${impact}`}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.impactBar,
            {
              height: 4 + index * 2,
              backgroundColor: index < level ? color : 'rgba(255,255,255,0.08)',
            },
          ]}
        />
      ))}
    </View>
  );
}

function CalendarRow({ event }) {
  const time = formatTime(event.date);
  const currency = event.country || '?';
  const forecast = event.forecast ?? 'â€”';
  const previous = event.previous ?? 'â€”';
  const actual = event.actual ?? '';
  const actualCol = actual ? actualColor(actual, event.forecast, event.title) : null;

  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{time}</Text>
        <Text style={styles.currencyText}>{currency}</Text>
      </View>

      <View style={styles.infoCol}>
        <View style={styles.titleWrap}>
          <ImpactIndicator impact={event.impact} />
          <Text style={styles.titleText} numberOfLines={2}>
            {localizeTitle(event.title)}
          </Text>
        </View>
        <Text style={styles.countryText} numberOfLines={1} ellipsizeMode="tail">
          {localizeCountry(currency)}
        </Text>
      </View>

      <View style={styles.statsCol}>
        <Text
          style={[
            styles.actualValue,
            actualCol ? { color: actualCol } : actual ? styles.actualNeutral : styles.actualEmpty,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {actual || 'â€”'}
        </Text>
        <Text style={styles.subRow} numberOfLines={1} ellipsizeMode="tail">
          Dá»± bÃ¡o: <Text style={styles.subStrong}>{forecast}</Text>
          <Text style={styles.subSep}> Â· </Text>
          CÅ©: <Text style={styles.subStrong}>{previous}</Text>
        </Text>
      </View>
    </View>
  );
}

const DayGroup = forwardRef(function DayGroup({ date, events, isToday, compact }, ref) {
  return (
    <View ref={ref} id={`date-group-${date}`} style={styles.dayGroup}>
      <View style={styles.dateHeader}>
        <View style={styles.dateHeaderLeft}>
          <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>HÃ´m nay</Text>
            </View>
          )}
        </View>
        <Text style={styles.dateCount}>{events.length} sá»± kiá»‡n</Text>
      </View>
      {events.map((event, index) => (
        <CalendarRow
          key={`${event.date}-${index}`}
          event={event}
          compact={compact}
          last={index === events.length - 1}
        />
      ))}
    </View>
  );
});

export default function EconomicCalendarView() {
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [impact, setImpact] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showTodayButton, setShowTodayButton] = useState(false);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const todayRef = useRef(null);
  const todayKey = useMemo(() => new Date().toDateString(), []);

  const rescueFromHang = useCallback(() => {
    setLoading(false);
    setError('QuÃ¡ lÃ¢u khÃ´ng pháº£n há»“i (15s), hÃ£y thá»­ láº¡i.');
    showToast({
      type: 'error',
      title: 'Lá»‹ch kinh táº¿ quÃ¡ cháº­m',
      message: 'Káº¿t ná»‘i tá»›i server bá»‹ treo, hÃ£y thá»­ láº¡i.',
    });
  }, []);

  const load = useCallback(async (mode = 'initial') => {
    const abort = new AbortController();
    abortRef.current = abort;
    const timeout = setTimeout(() => abort.abort(), 12000);
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/calendar`, {
        signal: abort.signal,
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setEvents(json.events || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('QuÃ¡ thá»i gian chá» (12s), thá»­ láº¡i.');
        showToast({ type: 'error', title: 'Lá»‹ch kinh táº¿ quÃ¡ cháº­m', message: 'Káº¿t ná»‘i tá»›i server bá»‹ treo, hÃ£y thá»­ láº¡i.' });
        return;
      }
      setError(err.message);
      showToast({ type: 'error', title: 'Lá»—i lá»‹ch kinh táº¿', message: err.message });
    } finally {
      clearTimeout(timeout);
      if (mode === 'initial') setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
    return () => abortRef.current?.abort();
  }, [load]);

  const filtered = useMemo(() => {
    const list =
      impact === 'All' ? events : events.filter((event) => event.impact === impact);
    const now = Date.now();
    const valid = list.filter((event) => {
      if (!event || !event.date) return false;
      const time = new Date(event.date).getTime();
      return !Number.isNaN(time);
    });
    const upcoming = valid.filter((event) => new Date(event.date) >= now - 3600_000);
    const past = valid.filter((event) => new Date(event.date) < now - 3600_000);
    return [...upcoming, ...past];
  }, [events, impact]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const event of filtered) {
      const time = new Date(event.date).getTime();
      const key = Number.isNaN(time) ? '__unknown__' : new Date(event.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return [...map.entries()]
      .sort((a, b) => {
        const ta = new Date(a[0]).getTime();
        const tb = new Date(b[0]).getTime();
        if (Number.isNaN(ta)) return 1;
        if (Number.isNaN(tb)) return -1;
        return ta - tb;
      })
      .map(([date, items]) => ({ date, items }));
  }, [filtered]);

  const listData = useMemo(
    () =>
      sections.map((section) => ({
        key: section.date,
        date: section.date,
        events: section.items,
      })),
    [sections]
  );

  // AUTO-SCROLL Vá»€ HÃ”M NAY khi danh sÃ¡ch render xong.
  // Fallback: nhÃ³m tÆ°Æ¡ng lai gáº§n nháº¥t, cÃ²n khÃ´ng thÃ¬ nhÃ³m cuá»‘i (gáº§n hÃ´m nay nháº¥t).
  const listReady = !loading && !error && listData.length > 0;
  useEffect(() => {
    if (!listReady || typeof document === 'undefined') return;
    const timer = setTimeout(() => {
      let target = todayRef.current;
      if (!target) {
        const todayTime = new Date(todayKey).getTime();
        let index = listData.findIndex((group) => new Date(group.date).getTime() >= todayTime);
        if (index === -1) index = listData.length - 1;
        if (index >= 0) target = document.getElementById(`date-group-${listData[index].key}`);
      }
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 160);
    return () => clearTimeout(timer);
  }, [listReady, todayKey, listData]);

  // Hiá»‡n nÃºt "Vá» hÃ´m nay" khi cuá»™n xa khá»i nhÃ³m hÃ´m nay (> 240px).
  const handleScroll = useCallback(() => {
    const scroller = scrollRef.current;
    const todayEl = todayRef.current;
    if (!scroller || !todayEl) return;
    const scRect = scroller.getBoundingClientRect();
    const tRect = todayEl.getBoundingClientRect();
    const distance = tRect.top - scRect.top;
    setShowTodayButton(Math.abs(distance) > 240);
  }, []);

  const scrollToToday = useCallback(() => {
    let target = todayRef.current;
    if (!target && typeof document !== 'undefined') {
      const todayTime = new Date(todayKey).getTime();
      let index = listData.findIndex((group) => new Date(group.date).getTime() >= todayTime);
      if (index === -1) index = listData.length - 1;
      if (index >= 0) target = document.getElementById(`date-group-${listData[index].key}`);
    }
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [todayKey, listData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Lá»ŠCH KINH Táº¾</Text>
          <Text style={styles.headerSub}>ChÃ¢u Ã Â· ChÃ¢u Ã‚u Â· Má»¹</Text>
        </View>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => load('refresh')}
          activeOpacity={0.7}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Text style={styles.updateBtnText}>â†» Cáº­p nháº­t</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filtersBar}>
        {IMPACT_FILTERS.map((filter) => {
          const isActive = impact === filter.key;
          const active = FILTER_ACTIVE_STYLES[filter.key];
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: active.backgroundColor,
                  borderColor: active.borderColor,
                },
              ]}
              onPress={() => setImpact(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, isActive && { color: active.textColor }]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>KhÃ´ng táº£i Ä‘Æ°á»£c lá»‹ch kinh táº¿ â€” {error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, styles.errorRetry]}
            onPress={() => load('refresh')}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Thá»­ láº¡i</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !error ? (
        <View style={styles.center}>
          <TimeoutWatch onTimeout={rescueFromHang} />
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.centerText}>Äang táº£i lá»‹ch kinh táº¿â€¦</Text>
        </View>
      ) : !error && listData.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>ChÆ°a cÃ³ sá»± kiá»‡n cho ká»³ nÃ y.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => load('refresh')}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>LÃ m má»›i</Text>
          </TouchableOpacity>
        </View>
      ) : error ? null : (
        <ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={64}
        >
          {listData.map((item) => (
            <DayGroup
              key={item.key}
              date={item.date}
              events={item.events}
              isToday={item.date === todayKey}
              compact={compact}
              ref={item.date === todayKey ? todayRef : null}
            />
          ))}
          <View style={styles.safeBottom} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Nguá»“n: Trading Economics Â· MÃºi giá» Viá»‡t Nam</Text>
          </View>
        </ScrollView>
      )}

      {showTodayButton && !loading && !error && listData.length > 0 && (
        <TouchableOpacity
          style={styles.todayFab}
          onPress={scrollToToday}
          activeOpacity={0.85}
          accessibilityLabel="Cuá»™n vá» hÃ´m nay"
        >
          <Text style={styles.todayFabText}>â–´ HÃ´m nay</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    minHeight: '45vh',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexShrink: 1,
  },
  headerTitle: {
    color: Z.zinc100,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY,
  },
  headerSub: {
    color: Z.zinc500,
    fontSize: 11,
    marginTop: 3,
    fontFamily: FONT_FAMILY,
  },
  updateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 76,
    alignItems: 'center',
  },
  updateBtnText: {
    color: Z.zinc300,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    color: Z.zinc500,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: 4,
  },
  dayGroup: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(11,20,38,0.90)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  dateHeaderText: {
    color: Z.zinc200,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  todayBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(245,166,35,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.30)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    color: Z.amber400,
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  dateCount: {
    color: Z.zinc500,
    fontSize: 12,
    fontWeight: '400',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    minHeight: 54,
  },
  timeCol: {
    width: '15%',
    flexShrink: 0,
    minWidth: 52,
  },
  timeText: {
    color: Z.zinc200,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  currencyText: {
    color: Z.zinc500,
    fontSize: 11,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  impactCol: {
    width: 14,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  impactBar: {
    width: 3,
    borderRadius: 1,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  titleText: {
    color: Z.zinc100,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
  },
  countryText: {
    color: Z.zinc500,
    fontSize: 11,
    marginTop: 3,
    marginLeft: 18,
    fontFamily: FONT_FAMILY,
  },
  statsCol: {
    width: '30%',
    flexShrink: 0,
    alignItems: 'flex-end',
    minWidth: 96,
  },
  actualValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  actualNeutral: {
    color: Z.zinc200,
  },
  actualEmpty: {
    color: Z.zinc600,
    fontWeight: '500',
  },
  subRow: {
    color: Z.zinc600,
    fontSize: 10,
    marginTop: 4,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  subStrong: {
    color: Z.zinc400,
  },
  subSep: {
    color: Z.zinc700,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    color: Z.zinc500,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(244,63,94,0.08)',
  },
  errorText: {
    color: Z.rose400,
    fontSize: 12,
    flex: 1,
    fontFamily: FONT_FAMILY,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9,
  },
  errorRetry: {
    marginTop: 0,
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  retryBtnText: {
    color: '#1A1205',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  safeBottom: {
    height: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    color: Z.zinc600,
    fontSize: 11,
    fontFamily: FONT_FAMILY,
  },
  todayFab: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39,39,42,0.92)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  todayFabText: {
    color: Z.amber400,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});