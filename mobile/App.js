import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal, Platform, Animated, Easing } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlameIcon, MarketIcon, CalendarDotIcon, BookmarkIcon, RadioIcon } from './src/components/TabIcons';
import { DownloadIcon } from './src/components/UIIcons';
import NewsViewModel from './src/viewmodels/NewsViewModel';
import NewsListView from './src/views/NewsListView';
import NewsArticleView from './src/views/NewsArticleView';
import NewsWebView from './src/views/NewsWebView';
import NotificationToast from './src/views/NotificationToast';
import WatchlistView from './src/views/WatchlistView';
import EconomicCalendarView from './src/views/EconomicCalendarView';
import SourcesView from './src/views/SourcesView';
import TradingViewScreen from './src/views/TradingViewScreen';
import AppHeader from './src/views/AppHeader';
import ToastHost from './src/components/ToastHost';
import ErrorBoundary from './src/components/ErrorBoundary';
import { showToast } from './src/services/ToastService';
import { triggerManualFetch } from './src/services/SourceService';
import { LocalStorageService } from './src/services/LocalStorageService';
import { normalizeUrl } from './src/utils/url';
import { COLORS, TAB_INACTIVE, FONT_FAMILY, TABULAR_NUMS } from './src/config/constants';

const TABS = {
  NEWS: 'news',
  GOLD: 'gold',
  CALENDAR: 'calendar',
  FOLLOW: 'follow',
  FEEDS: 'feeds',
};

const TOAST_DURATION_MS = 7000;
const MAX_TOASTS = 3;

function TabBar({ active, onChange, insets, badge, hidden }) {
  const tabs = [
    { key: TABS.NEWS, label: 'Tin nóng', icon: FlameIcon },
    { key: TABS.GOLD, label: 'Vàng XAU', icon: MarketIcon },
    { key: TABS.CALENDAR, label: 'Lịch KT', icon: CalendarDotIcon },
    { key: TABS.FOLLOW, label: 'Quan tâm', icon: BookmarkIcon },
    { key: TABS.FEEDS, label: 'Nguồn tin', icon: RadioIcon },
  ];

  const hiding = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(hiding, {
      toValue: hidden ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hidden, hiding]);

  const navStyle = {
    opacity: hiding.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      {
        translateY: hiding.interpolate({ inputRange: [0, 1], outputRange: [0, 160] }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.tabBar,
        { paddingBottom: Math.max(insets.bottom, 8) },
        navStyle,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.tabTopLine} />}
            <Icon
              size={20}
              strokeWidth={isActive ? 2 : 1.6}
              variant={isActive ? 'solid' : 'outline'}
              color={isActive ? '#F1F5F9' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            {badge > 0 && tab.key === TABS.NEWS && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const ready = () => setPrompt(window.__asterDeferredPrompt || null);
    const installed = () => setPrompt(null);
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.__asterDeferredPrompt) ready();
    window.addEventListener('aster-prompt-ready', ready);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('aster-prompt-ready', ready);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice && choice.outcome === 'accepted') setPrompt(null);
    else setPrompt(null);
  };

  return { canInstall: Boolean(prompt), install };
}

function MainScreen() {
  const insets = useSafeAreaInsets();
  const { canInstall, install } = useInstallPrompt();
  const [activeTab, setActiveTab] = useState(TABS.NEWS);
  const [chartNavVisible, setChartNavVisible] = useState(true);
  const [openedArticle, setOpenedArticle] = useState(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeTab === TABS.GOLD) return;
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab, headerOpacity]);
  const [toasts, setToasts] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [embedArticle, setEmbedArticle] = useState(false);
  const seqRef = useRef(0);
  const toastTimersRef = useRef(new Map());
  const viewModelRef = useRef(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new NewsViewModel();
  }
  const vm = viewModelRef.current;

  const [state, setState] = useState({ items: [], loading: true, error: null });
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const reloadAll = useCallback(async () => {
    if (manualRefreshing) return;
    setManualRefreshing(true);
    showToast({ type: 'info', title: 'Đang cào tin mới…' });
    try {
      const result = await triggerManualFetch();
      await vm.refresh();
      if (!result?.ok) {
        showToast({
          type: 'error',
          title: 'Cập nhật thất bại',
          message: result?.error || 'Không xác định được lỗi.',
        });
      } else if (result.upserted > 0) {
        showToast({
          type: 'success',
          title: `Đã cập nhật ${result.upserted} tin mới`,
          message: `Scraped ${result.scraped} bài hệ thống + ${result.user_feeds} nguồn của bạn.`,
        });
      } else {
        showToast({
          type: 'info',
          title: 'Không có tin mới',
          message: 'Đã kiểm tra tất cả nguồn tin, mọi thứ đều cập nhật.',
        });
      }
    } catch (error) {
      await vm.refresh();
      showToast({ type: 'error', title: 'Cập nhật thất bại', message: error.message });
    } finally {
      setManualRefreshing(false);
    }
  }, [manualRefreshing, vm]);

  const dismissToast = (id) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((list) => list.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const unsubscribe = vm.subscribe((nextState) => setState(nextState));
    const unsubNewItem = vm.onNewItem((item) => {
      const id = ++seqRef.current;
      setNewCount((count) => count + 1);
      setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, item }]);
      const timer = setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
      toastTimersRef.current.set(id, timer);
    });
    vm.start();
    return () => {
      unsubscribe();
      unsubNewItem();
      vm.stop();
      toastTimersRef.current.forEach((timer) => clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, [vm]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([LocalStorageService.getWatchKeywords(), LocalStorageService.getBookmarks()]).then(
      ([kw, marks]) => {
        if (cancelled) return;
        setKeywords(kw);
        setBookmarks(marks);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const connected = !state.error;

  const openInNewTab = (url) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const anchor = document.createElement('a');
    anchor.href = normalizeUrl(url);
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const toggleBookmark = async (item) => {
    const exists = bookmarks.some((bookmark) => bookmark.id === item.id);
    if (exists) {
      await LocalStorageService.removeBookmark(item.id);
      setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== item.id));
      showToast({ type: 'info', title: 'Đã bỏ lưu bài viết' });
    } else {
      await LocalStorageService.addBookmark(item);
      setBookmarks([item, ...bookmarks]);
      showToast({ type: 'success', title: 'Đã lưu bài viết', message: 'Vào tab "Quan tâm" để xem lại.' });
    }
  };

  const addKeyword = async (keyword) => {
    const next = keywords.includes(keyword) ? keywords : [...keywords, keyword];
    setKeywords(next);
    await LocalStorageService.setWatchKeywords(next);
    if (!keywords.includes(keyword)) {
      showToast({ type: 'success', title: 'Đã thêm từ khóa', message: keyword });
    }
  };

  const removeKeyword = async (keyword) => {
    const next = keywords.filter((k) => k !== keyword);
    setKeywords(next);
    await LocalStorageService.setWatchKeywords(next);
    showToast({ type: 'info', title: 'Đã xóa từ khóa', message: keyword });
  };

  const openArticle = (item) => {
    setOpenedArticle(item);
    setEmbedArticle(false);
  };

  const closeArticle = () => {
    setOpenedArticle(null);
    setEmbedArticle(false);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === TABS.NEWS) setNewCount(0);
    if (key === TABS.GOLD) {
      setChartNavVisible(true);
    }
  };

  const showChart = activeTab === TABS.GOLD;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {!showChart && (
        <Animated.View style={{ opacity: headerOpacity }}>
          <AppHeader
            connected={connected}
            loading={state.loading || manualRefreshing}
            onRefresh={reloadAll}
          />
        </Animated.View>
      )}

      <View style={styles.content}>
        {activeTab === TABS.NEWS && (
          <ErrorBoundary>
            <NewsListView
              items={state.items}
              loading={state.loading || manualRefreshing}
              error={state.error}
              onItemPress={openArticle}
              onRefresh={reloadAll}
            />
          </ErrorBoundary>
        )}
        {activeTab === TABS.GOLD && (
          <ErrorBoundary>
            <TradingViewScreen onRequestChartTouch={() => setChartNavVisible(false)} />
          </ErrorBoundary>
        )}
        {activeTab === TABS.CALENDAR && (
          <ErrorBoundary>
            <EconomicCalendarView />
          </ErrorBoundary>
        )}
        {activeTab === TABS.FOLLOW && (
          <ErrorBoundary>
            <WatchlistView
              items={state.items}
              keywords={keywords}
              onAddKeyword={addKeyword}
              onRemoveKeyword={removeKeyword}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              onOpenArticle={openArticle}
            />
          </ErrorBoundary>
        )}
        {activeTab === TABS.FEEDS && (
          <ErrorBoundary>
            <SourcesView items={state.items} onOpenArticle={openArticle} />
          </ErrorBoundary>
        )}

        {toasts.map((toast, index) => (
          <NotificationToast
            key={toast.id}
            item={toast.item}
            offset={index}
            onClose={() => dismissToast(toast.id)}
            onPress={() => {
              dismissToast(toast.id);
              setActiveTab(TABS.NEWS);
              openArticle(toast.item);
            }}
          />
        ))}
        <ToastHost />
      </View>

      <TabBar
        active={activeTab}
        onChange={handleTabChange}
        insets={insets}
        badge={activeTab !== TABS.NEWS ? newCount : 0}
        hidden={showChart && !chartNavVisible}
      />

      {showChart && !chartNavVisible && (
        <TouchableOpacity
          style={styles.navReveal}
          onPress={() => setChartNavVisible(true)}
          activeOpacity={0.8}
          accessibilityLabel="Hiện thanh điều hướng"
        >
          <View style={styles.navRevealBar} />
        </TouchableOpacity>
      )}

      {canInstall && (
        <TouchableOpacity style={styles.installButton} onPress={install} activeOpacity={0.85}>
          <View style={styles.installIconWrap}>
            <DownloadIcon size={19} color={COLORS.primary} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.installTitle}>Cài đặt MacroPulse</Text>
            <Text style={styles.installSub}>Dùng như ứng dụng riêng</Text>
          </View>
        </TouchableOpacity>
      )}

      <Modal
        visible={Boolean(openedArticle)}
        onRequestClose={closeArticle}
        animationType="slide"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeArticle}>
              <Text style={styles.closeButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {openedArticle?.source || 'Đang mở bài viết'}
            </Text>
            <TouchableOpacity
              style={styles.externalButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  openInNewTab(openedArticle?.url);
                } else {
                  setEmbedArticle(true);
                }
              }}
              accessibilityLabel="Mở ở tab mới"
            >
              <Text style={styles.externalText}>↗ Mở tab</Text>
            </TouchableOpacity>
          </View>
          {openedArticle ? (
            embedArticle ? (
              <NewsWebView url={openedArticle.url} />
            ) : (
              <NewsArticleView
                item={openedArticle}
                onOpenOriginal={() => {
                  if (Platform.OS === 'web') openInNewTab(openedArticle.url);
                  else setEmbedArticle(true);
                }}
                onToggleBookmark={() => toggleBookmark(openedArticle)}
                isBookmarked={bookmarks.some((bookmark) => bookmark.id === openedArticle.id)}
              />
            )
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 0,
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    position: 'relative',
  },
  navReveal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
    zIndex: 200,
  },
  navRevealBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.35)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 9,
    paddingBottom: 3,
    position: 'relative',
  },
  tabTopLine: {
    position: 'absolute',
    top: 0,
    alignSelf: 'stretch',
    height: 2,
    marginHorizontal: 22,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  tabItemActive: {
    backgroundColor: 'rgba(245,166,35,0.06)',
  },
  tabLabel: {
    color: TAB_INACTIVE,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
    fontFamily: FONT_FAMILY,
  },
  tabLabelActive: {
    color: '#F1F5F9',
    fontWeight: '600',
  },
  tabIndicator: {
    marginTop: 5,
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  badgeDot: {
    position: 'absolute',
    top: 1,
    right: '24%',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.important,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    fontVariant: TABULAR_NUMS,
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  closeButton: {
    width: 40,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    fontFamily: FONT_FAMILY,
  },
  externalButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  externalText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  modalSpacer: {
    width: 40,
  },
  installButton: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  installIconWrap: {
    marginRight: 10,
  },
  installTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  installSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
    fontFamily: FONT_FAMILY,
  },
});