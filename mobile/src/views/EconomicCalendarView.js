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
  Animated,
  Easing,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { COLORS, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';
import { BACKEND_URL } from '../config/constants';
import { fetchLatestNews } from '../services/SupabaseService';
import { ChevronUpIcon, RefreshIcon } from '../components/UIIcons';
import { showToast } from '../services/ToastService';
import localizeTitle, {
  localizeCountry,
  formatDateHeader,
  formatTime,
} from '../utils/calendarVi';

const Z = {
  zinc100: '#F8FAFC',
  zinc200: '#E2E8F0',
  zinc300: '#CBD5E1',
  zinc400: '#94A3B8',
  zinc500: '#64748B',
  zinc600: '#475569',
  zinc700: '#334155',
  zinc800: '#1E293B',
  rose400: '#FB7185',
  rose500: '#F43F5E',
  amber400: '#F5A623',
  emerald400: '#34D399',
};

const IMPACT_FILTERS = [
  { key: 'All', label: 'Tất cả' },
  { key: 'High', label: 'Quan trọng' },
  { key: 'Medium', label: 'Trung bình' },
  { key: 'Low', label: 'Thấp' },
];

const FILTER_ACTIVE_STYLES = {
  All: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    textColor: '#F8FAFC',
  },
  High: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
    textColor: '#FB7185',
  },
  Medium: {
    backgroundColor: 'rgba(245, 166, 35, 0.14)',
    borderColor: 'rgba(245, 166, 35, 0.35)',
    textColor: '#F5A623',
  },
  Low: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    textColor: '#94A3B8',
  },
};

// Đếm ngược hiển thị khi tin sắp ra trong vòng 5 phút.
const COUNTDOWN_WINDOW_MS = 5 * 60 * 1000;
// Sau khi qua giờ ra tin, vẫn xoay icon chờ kết quả trong tối đa 4 giờ.
const SPIN_PAST_MS = 4 * 60 * 60 * 1000;
// Tin liên quan ảnh hưởng giá vàng/bạc/CPI/Fed.
const RELATED_TERM_RE =
  /fed|fomc|rate decision|interest rate|cpi|inflation|ppi|gold|xau|silver|xag|vàng|bạc|oil|brent|treasury|dollar index|dxy/i;
const RELATED_JUNK_RE =
  /(live|bitcoin|crypto|presale|airdropp?|casino|betting|free signal|sponsored|advertising|discount|sale|limited time|sign up)/i;

function TimeoutWatch({ onTimeout }) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, 15000);
    return () => clearTimeout(timer);
  }, [onTimeout]);
  return null;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(ms) {
  const diff = Date.now() - ms;
  if (diff < 60 * 1000) return 'vừa xong';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}p`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

// Icon reload xoay liên tục — dùng khi qua giờ ra tin mà chưa có kết quả.
function SpinIcon({ size = 13, color = Z.amber400, strokeWidth = 2.2 }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <RefreshIcon size={size} color={color} strokeWidth={strokeWidth} />
    </Animated.View>
  );
}

// Cờ "Actual tốt hơn Dự báo" có thật không — heuristic cho loại chỉ số nghịch đảo.
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

// Thanh vạch impact 1/2/3 (TradingView-style) thay cho badge chữ.
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

function CalendarRow({ event, compact, now, last }) {
  const time = formatTime(event.date);
  const currency = event.country || '?';
  const forecast = event.forecast ?? '—';
  const previous = event.previous ?? '—';
  const actual = event.actual ?? '';
  const actualCol = actual ? actualColor(actual, event.forecast, event.title) : null;
  const eventMs = new Date(event.date || 0).getTime();
  const diff = eventMs - now;
  const countDown = diff > 0 && diff <= COUNTDOWN_WINDOW_MS;
  const waiting = !actual && diff <= 0 && now - eventMs <= SPIN_PAST_MS;
  const isFed = /fed|fomc/i.test(String(event.title || ''));

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{time}</Text>
        <View style={styles.currencyPill}>
          <Text style={styles.currencyText}>{currency}</Text>
        </View>
        {countDown ? (
          <Text
            style={styles.countdownText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            Còn {formatCountdown(diff)}
          </Text>
        ) : waiting ? (
          <View style={styles.waitingIconWrap}>
            <SpinIcon size={12} color={Z.amber400} strokeWidth={2.4} />
          </View>
        ) : null}
      </View>

      <View style={styles.infoCol}>
        <View style={styles.titleWrap}>
          <ImpactIndicator impact={event.impact} />
          {isFed && (
            <View style={styles.fedTag}>
              <Text style={styles.fedTagText}>FED</Text>
            </View>
          )}
          <Text style={styles.titleText} numberOfLines={2}>
            {localizeTitle(event.title)}
          </Text>
        </View>
        <Text style={styles.countryText} numberOfLines={1} ellipsizeMode="tail">
          {localizeCountry(currency)}
        </Text>
      </View>

      <View style={styles.statsCol}>
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Hiện tại
            </Text>
            <Text
              style={[
                styles.statValue,
                actualCol ? { color: actualCol } : actual ? styles.actualNeutral : styles.actualEmpty,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {actual || '—'}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Dự báo
            </Text>
            <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.6}>
              {forecast}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Cũ
            </Text>
            <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.6}>
              {previous}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const DayGroup = forwardRef(function DayGroup({ date, events, isToday, compact, now }, ref) {
  return (
    <View ref={ref} id={`date-group-${date}`} style={styles.dayGroup}>
      <View style={styles.dateHeader}>
        <View style={styles.dateHeaderLeft}>
          <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Hôm nay</Text>
            </View>
          )}
        </View>
        <Text style={styles.dateCount}>{events.length} sự kiện</Text>
      </View>
      {events.map((event, index) => (
        <View
          key={`${event.date}-${index}`}
          id={`event-row-${date}-${index}`}
        >
          <CalendarRow
            event={event}
            compact={compact}
            now={now}
            last={index === events.length - 1}
          />
        </View>
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
  const [related, setRelated] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [showTodayButton, setShowTodayButton] = useState(false);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const todayRef = useRef(null);
  const pollBusyRef = useRef(false);
  const didFocus = useRef(false);
  const todayKey = useMemo(() => new Date().toDateString(), []);

  // Ticker 1s để đếm ngược chạy realtime.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rescueFromHang = useCallback(() => {
    setLoading(false);
    setError('Quá lâu không phản hồi (15s), hãy thử lại.');
    showToast({
      type: 'error',
      title: 'Lịch kinh tế quá chậm',
      message: 'Kết nối tới server bị treo, hãy thử lại.',
    });
  }, []);

  const loadEvents = useCallback(async (mode = 'initial') => {
    const abort = new AbortController();
    abortRef.current = abort;
    const timeout = setTimeout(() => abort.abort(), 12000);
    if (mode === 'initial') setLoading(true);
    else if (mode === 'refresh') setRefreshing(true);
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
        if (mode !== 'poll') {
          setError('Quá thời gian chờ (12s), thử lại.');
          showToast({ type: 'error', title: 'Lịch kinh tế quá chậm', message: 'Kết nối tới server bị treo, hãy thử lại.' });
        }
        return;
      }
      if (mode !== 'poll') {
        setError(err.message);
        showToast({ type: 'error', title: 'Lỗi lịch kinh tế', message: err.message });
      }
    } finally {
      clearTimeout(timeout);
      if (mode === 'initial') setLoading(false);
      else if (mode === 'refresh') setRefreshing(false);
    }
  }, []);

  const loadRelated = useCallback(async () => {
    try {
      const items = await fetchLatestNews(60);
      const scored = items
        .filter(
          (item) =>
            item?.title &&
            RELATED_TERM_RE.test(item.title) &&
            !RELATED_JUNK_RE.test(item.title)
        )
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 6);
      setRelated(scored);
    } catch {
      /* best-effort */
    }
  }, []);

  useEffect(() => {
    loadEvents('initial');
    loadRelated();
    return () => abortRef.current?.abort();
  }, [loadEvents, loadRelated]);

  // Auto-poll 30s: cập nhật chỉ số hiện tại + tin liên quan ngay khi có kết quả.
  useEffect(() => {
    const timer = setInterval(() => {
      if (pollBusyRef.current) return;
      pollBusyRef.current = true;
      Promise.resolve()
        .then(() => loadEvents('poll'))
        .catch(() => {})
        .finally(() => {
          pollBusyRef.current = false;
          loadRelated();
        });
    }, 30000);
    return () => clearInterval(timer);
  }, [loadEvents, loadRelated]);

  const filtered = useMemo(() => {
    const list =
      impact === 'All' ? events : events.filter((event) => event.impact === impact);
    const nowMs = Date.now();
    const valid = list.filter((event) => {
      if (!event || !event.date) return false;
      const time = new Date(event.date).getTime();
      return !Number.isNaN(time);
    });
    const upcoming = valid.filter((event) => new Date(event.date) >= nowMs - 3600_000);
    const past = valid.filter((event) => new Date(event.date) < nowMs - 3600_000);
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

  // Vị trí cần "mount": hôm nay, ở sự kiện đang/đến giờ hoặc sắp ra gần nhất.
  const focusId = useMemo(() => {
    if (!listData.length) return null;
    const nowMs = Date.now();
    const todayIndex = listData.findIndex((g) => g.date === todayKey);
    let idx = todayIndex;
    if (idx < 0) idx = listData.findIndex((g) => new Date(g.date).getTime() >= nowMs);
    if (idx < 0) idx = listData.length - 1;
    const group = listData[idx];
    const focus = group.events.find(
      (e) => new Date(e.date).getTime() >= nowMs - 10 * 60 * 1000
    );
    return focus
      ? `event-row-${group.key}-${group.events.indexOf(focus)}`
      : `date-group-${group.key}`;
  }, [listData, todayKey]);

  const listReady = !loading && !error && listData.length > 0;
  useEffect(() => {
    if (!listReady || typeof document === 'undefined' || didFocus.current) return;
    didFocus.current = true;
    const timer = setTimeout(() => {
      let target = null;
      if (focusId) target = document.getElementById(focusId);
      if (!target) target = todayRef.current;
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [listReady, focusId]);

  // Hiện nút "Về hôm nay" khi cuộn xa khỏi nhóm hôm nay (> 240px).
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
          <Text style={styles.headerTitle}>LỊCH KINH TẾ</Text>
          <Text style={styles.headerSub}>Châu Á · Châu Âu · Mỹ</Text>
        </View>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => loadEvents('refresh')}
          activeOpacity={0.7}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <View style={styles.updateBtnContent}>
              <RefreshIcon size={13} color={Z.zinc300} strokeWidth={2.2} />
              <Text style={styles.updateBtnText}>Cập nhật</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {related.length > 0 && (
        <View style={styles.relatedWrap}>
          <Text style={styles.relatedTitle}>Tin ảnh hưởng · Vàng/Bạc · CPI · Fed</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedRow}
          >
            {related.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.relatedChip}
                onPress={() => Linking.openURL(item.url).catch(() => {})}
                activeOpacity={0.7}
              >
                <Text style={styles.relatedChipText} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.relatedChipTime}>
                  {timeAgo(item.publishedAt.getTime())}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
          <Text style={styles.errorText}>Không tải được lịch kinh tế — {error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, styles.errorRetry]}
            onPress={() => loadEvents('refresh')}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !error ? (
        <View style={styles.center}>
          <TimeoutWatch onTimeout={rescueFromHang} />
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.centerText}>Đang tải lịch kinh tế…</Text>
        </View>
      ) : !error && listData.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>Chưa có sự kiện cho kỳ này.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadEvents('refresh')}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Làm mới</Text>
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
              now={now}
              ref={item.date === todayKey ? todayRef : null}
            />
          ))}
          <View style={styles.safeBottom} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Nguồn: Trading Economics · Giá: Yahoo Finance · Múi giờ Việt Nam</Text>
          </View>
        </ScrollView>
      )}

      {showTodayButton && !loading && !error && listData.length > 0 && (
        <TouchableOpacity
          style={styles.todayFab}
          onPress={scrollToToday}
          activeOpacity={0.85}
          accessibilityLabel="Cuộn về hôm nay"
        >
          <View style={styles.todayFabIconWrap}>
            <ChevronUpIcon size={14} color={Z.amber400} strokeWidth={2.5} />
          </View>
          <Text style={styles.todayFabText}>Hôm nay</Text>
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
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(11, 14, 20, 0.82)',
  },
  headerLeft: {
    flexShrink: 1,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: FONT_FAMILY,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
    fontFamily: FONT_FAMILY,
  },
  updateBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 76,
    alignItems: 'center',
  },
  updateBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateBtnText: {
    color: Z.zinc300,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
    fontFamily: FONT_FAMILY,
  },
  relatedWrap: {
    paddingTop: 10,
  },
  relatedTitle: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 6,
    fontFamily: FONT_FAMILY,
  },
  relatedRow: {
    paddingHorizontal: 12,
    paddingRight: 4,
    gap: 6,
    alignItems: 'center',
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 280,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  relatedChipText: {
    color: Z.zinc200,
    fontSize: 11,
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
  },
  relatedChipTime: {
    color: Z.zinc500,
    fontSize: 10,
    marginLeft: 6,
    flexShrink: 0,
    fontFamily: FONT_FAMILY,
  },
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingBottom: 4,
  },
  dayGroup: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    backdropFilter: 'blur(16px)',
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
    color: '#F8FAFC',
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  todayBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.30)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  todayBadgeText: {
    color: Z.amber400,
    fontSize: 10.5,
    fontWeight: '600',
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    minHeight: 58,
  },
  rowCompact: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  timeCol: {
    width: 58,
    flexShrink: 0,
  },
  timeText: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  currencyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  currencyText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  countdownText: {
    color: Z.amber400,
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 3,
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  waitingIconWrap: {
    marginTop: 4,
    alignItems: 'flex-start',
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
  fedTag: {
    backgroundColor: 'rgba(245, 166, 35, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.35)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 5,
  },
  fedTagText: {
    color: Z.amber400,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  titleText: {
    color: '#F1F5F9',
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
  },
  countryText: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 2,
    marginLeft: 18,
    fontFamily: FONT_FAMILY,
  },
  statsCol: {
    width: '34%',
    flexShrink: 0,
    minWidth: 0,
    alignItems: 'stretch',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  statCell: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9.5,
    lineHeight: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontFamily: FONT_FAMILY,
  },
  statValue: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 3,
    color: '#CBD5E1',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  actualNeutral: {
    color: '#F8FAFC',
  },
  actualEmpty: {
    color: '#475569',
    fontWeight: '500',
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
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 63, 94, 0.20)',
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
    color: '#0B0E14',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  safeBottom: {
    height: 12,
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
    bottom: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 27, 43, 0.92)',
    backdropFilter: 'blur(16px)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.30)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  todayFabIconWrap: {
    marginRight: 5,
  },
  todayFabText: {
    color: Z.amber400,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});