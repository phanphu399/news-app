import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS, FONT_FAMILY, TABULAR_NUMS } from '../config/constants';
import { BACKEND_URL } from '../config/constants';
import { showToast } from '../services/ToastService';
import Card from '../components/Card';
import localizeTitle, {
  localizeCountry,
  localizeImpact,
  formatDateHeader,
  formatTime,
} from '../utils/calendarVi';

const IMPACT_COLORS = {
  High: COLORS.important,
  Medium: COLORS.amber,
  Low: COLORS.success,
};

const IMPACT_FILTERS = [
  { key: 'All', label: 'Tất cả' },
  { key: 'High', label: 'Quan trọng' },
  { key: 'Medium', label: 'Trung bình' },
  { key: 'Low', label: 'Thấp' },
];

function TimeoutWatch({ onTimeout }) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, 15000);
    return () => clearTimeout(timer);
  }, [onTimeout]);
  return null;
}

function ImpactBadge({ impact }) {
  return (
    <View style={[styles.impactBadge, { backgroundColor: `${IMPACT_COLORS[impact]}22` }]}>
      <View style={[styles.impactDot, { backgroundColor: IMPACT_COLORS[impact] }]} />
      <Text style={[styles.impactText, { color: IMPACT_COLORS[impact] }]}>
        {localizeImpact(impact)}
      </Text>
    </View>
  );
}

function CalendarRow({ event, last }) {
  const time = formatTime(event.date);
  const country = event.country || '?';
  const hasValues = Boolean(event.forecast || event.previous);

  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{time}</Text>
        <Text style={styles.countryCode}>{country}</Text>
      </View>

      <View style={styles.titleCol}>
        <Text style={styles.titleText} numberOfLines={2}>
          {localizeTitle(event.title)}
        </Text>
        <View style={styles.metaRow}>
          <ImpactBadge impact={event.impact} />
          <Text style={styles.countryName}>{localizeCountry(country)}</Text>
        </View>
      </View>

      {hasValues ? (
        <View style={styles.statsCol}>
          <Text style={styles.statText}>
            <Text style={styles.statLabel}>Cũ: </Text>
            <Text style={styles.statValue}>{event.previous || '—'}</Text>
          </Text>
          <Text style={styles.statText}>
            <Text style={styles.statLabel}>Dự báo: </Text>
            <Text style={styles.statValue}>{event.forecast || '—'}</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.statsCol}>
          <Text style={styles.statEmpty}>Chưa có số liệu</Text>
        </View>
      )}
    </View>
  );
}

function DayCard({ date, events }) {
  return (
    <Card style={styles.dayCard}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
        <Text style={styles.dateCount}>{events.length} sự kiện</Text>
      </View>
      {events.map((event, index) => (
        <CalendarRow key={index} event={event} last={index === events.length - 1} />
      ))}
    </Card>
  );
}

export default function EconomicCalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [impact, setImpact] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef(null);

  const rescueFromHang = useCallback(() => {
    setLoading(false);
    setError('Quá lâu không phản hồi (15s), hãy thử lại.');
    showToast({
      type: 'error',
      title: 'Lịch kinh tế quá chậm',
      message: 'Kết nối tới server bị treo, hãy thử lại.',
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
        setError('Quá thời gian chờ (12s), thử lại.');
        showToast({ type: 'error', title: 'Lịch kinh tế quá chậm', message: 'Kết nối tới server bị treo, hãy thử lại.' });
        return;
      }
      setError(err.message);
      showToast({ type: 'error', title: 'Lỗi lịch kinh tế', message: err.message });
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

  const renderItem = useCallback(({ item }) => {
    return <DayCard date={item.date} events={item.events} />;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>LỊCH KINH TẾ</Text>
          <Text style={styles.headerSub}>Châu Á · Châu Âu · Mỹ</Text>
        </View>
      </View>

      <View style={styles.filtersBar}>
        {IMPACT_FILTERS.map((filter) => {
          const isActive = impact === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setImpact(filter.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: filter.key === 'All' ? COLORS.textSecondary : IMPACT_COLORS[filter.key] },
                ]}
              />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
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
            onPress={() => load('refresh')}
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
            onPress={() => load('refresh')}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      ) : error ? null : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          initialNumToRender={25}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>Nguồn: Trading Economics · Cập nhật tự động</Text>
            </View>
          }
          refreshControl={
            <RefreshControlStyled refreshing={refreshing} onRefresh={() => load('refresh')} />
          }
        />
      )}
    </View>
  );
}

function RefreshControlStyled({ refreshing, onRefresh }) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={COLORS.primary}
      colors={[COLORS.primary]}
      progressBackgroundColor={COLORS.surface}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    minHeight: '45vh',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(240,168,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(240,168,92,0.30)',
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    color: COLORS.textMuted,
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
    backgroundColor: 'rgba(229,99,110,0.08)',
  },
  errorText: {
    color: COLORS.danger,
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
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  dayCard: {
    marginHorizontal: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
  },
  dateHeaderText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  dateCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  timeCol: {
    width: 62,
  },
  timeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  countryCode: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  titleCol: {
    flex: 1,
    paddingRight: 8,
  },
  titleText: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
    fontFamily: FONT_FAMILY,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  impactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  countryName: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT_FAMILY,
  },
  statsCol: {
    alignItems: 'flex-end',
    minWidth: 78,
  },
  statText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statLabel: {
    color: COLORS.textMuted,
  },
  statValue: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  statEmpty: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT_FAMILY,
  },
});