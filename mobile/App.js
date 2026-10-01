import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal, Platform, Animated, Easing } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlameIcon, MarketIcon, CalendarDotIcon, BookmarkIcon, RadioIcon } from './src/components/TabIcons';
import { DownloadIcon, XIcon } from './src/components/UIIcons';
import { useOnlineStatus } from './src/hooks/useOnlineStatus';
import {
  isStandalone,
  isIosSafari,
  getInstallPreference,
  persistInstallDismissed,
  isUpdateDismissed,
  persistUpdateDismissed,
} from './src/utils/webPwa';
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
import LiveTicker from './src/components/LiveTicker';
import ToastHost from './src/components/ToastHost';
import ErrorBoundary from './src/components/ErrorBoundary';
import { showToast } from './src/services/ToastService';
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

const TOAST_DURATION_MS = 8000;
const MAX_TOASTS = 3;

// ─── Animated Tab Item ──────────────────────────────────────────────────────
function TabItem({ tab, isActive, onPress, badge }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0.5)).current;
  const Icon = tab.icon;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(glowOpacity, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(labelOpacity, {
        toValue: isActive ? 1 : 0.5,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.87, useNativeDriver: true, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  // Badge pulse
  const badgePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!badge) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    return () => badgePulse.setValue(1);
  }, [badge]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabItemInner, { transform: [{ scale }] }]}>
        {/* Glow background for active */}
        <Animated.View style={[styles.tabGlow, { opacity: glowOpacity }]} />

        <Icon
          size={20}
          strokeWidth={isActive ? 2.2 : 1.6}
          variant={isActive ? 'solid' : 'outline'}
          color={isActive ? COLORS.primary : TAB_INACTIVE}
        />

        <Animated.Text
          style={[
            styles.tabLabel,
            isActive && styles.tabLabelActive,
            { opacity: labelOpacity },
          ]}
        >
          {tab.label}
        </Animated.Text>

        {/* Active indicator dot với cyan glow */}
        {isActive && <View style={styles.activeDot} />}

        {/* Badge */}
        {badge > 0 && tab.key === TABS.NEWS && (
          <Animated.View style={[styles.badgeDot, { transform: [{ scale: badgePulse }] }]}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
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
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hidden, hiding]);

  const navStyle = {
    opacity: hiding.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      {
        translateY: hiding.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }),
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
      {/* Top cyan glow separator */}
      <View style={styles.tabTopGlow} />
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          isActive={active === tab.key}
          onPress={() => onChange(tab.key)}
          badge={tab.key === TABS.NEWS ? badge : 0}
        />
      ))}
    </Animated.View>
  );
}

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return true;
    return Boolean(getInstallPreference());
  });
  const iosStandalone =
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.navigator.standalone === true : false;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isStandalone() || iosStandalone) return;
    const ready = () => {
      if (window.__asterInstalled) {
        setPrompt(null);
        return;
      }
      setPrompt(window.__asterDeferredPrompt || null);
    };
    const installed = () => setPrompt(null);
    if (window.__asterDeferredPrompt) ready();
    window.addEventListener('aster-prompt-ready', ready);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('aster-prompt-ready', ready);
      window.removeEventListener('appinstalled', installed);
    };
  }, [iosStandalone]);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    try {
      const choice = await prompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setPrompt(null);
        persistInstallDismissed();
      } else {
        setPrompt(null);
      }
    } catch {
      setPrompt(null);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    persistInstallDismissed();
  };

  const canPrompt = !dismissed && !isStandalone() && !iosStandalone && Boolean(prompt);
  const showIosGuide = !dismissed && !isStandalone() && isIosSafari() && !iosStandalone && !canPrompt;

  return { canInstall: canPrompt, showIosGuide, install, dismiss };
}

function ConnectivityStrip({ online, justReturned }) {
  const anim = useRef(new Animated.Value(0)).current;
  const visible = !online || justReturned;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  if (!visible) return null;

  const color = online ? COLORS.success : COLORS.danger;
  const text = online ? '● Đã kết nối' : '○ Ngoại tuyến — dữ liệu có thể chưa cập nhật';

  return (
    <Animated.View
      style={[
        styles.connStrip,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
        },
      ]}
    >
      <View style={[styles.connDot, { backgroundColor: color }]} />
      <Text style={[styles.connText, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  );
}

function MainScreen() {
  const insets = useSafeAreaInsets();
  const { online, justReturned } = useOnlineStatus();
  const { canInstall, showIosGuide, install, dismiss } = useInstallPrompt();
  const [updateVersion, setUpdateVersion] = useState(null);
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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const detect = (version) => {
      if (version && version !== updateVersion && !isUpdateDismissed(version)) {
        setUpdateVersion(version);
      }
    };
    const onReady = (event) => detect(event && event.detail);
    if (window.__asterPendingUpdate) detect(window.__asterPendingUpdate);
    window.addEventListener('aster-update-ready', onReady);
    return () => window.removeEventListener('aster-update-ready', onReady);
  }, [updateVersion]);

  const applyUpdate = useCallback(async () => {
    const version = updateVersion;
    setUpdateVersion(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) await registration.update();
    } catch {}
    try {
      sessionStorage.setItem('aster-apply-' + version, '1');
      window.location.reload();
    } catch {}
  }, [updateVersion]);

  const laterUpdate = useCallback(() => {
    if (updateVersion) persistUpdateDismissed(updateVersion);
    setUpdateVersion(null);
  }, [updateVersion]);
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
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // Ẩn splash screen khi app load xong hoặc sau 2s
  useEffect(() => {
    if (!state.loading || state.items.length > 0) {
      setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setShowSplash(false));
      }, 800);
    }
  }, [state.loading, state.items.length, splashOpacity]);

  const reloadAll = useCallback(async () => {
    if (manualRefreshing) return;
    setManualRefreshing(true);
    showToast({ type: 'info', title: 'Đang làm mới tin tức…' });
    try {
      await vm.refresh();
      showToast({
        type: 'success',
        title: 'Đã làm mới',
        message: 'Danh sách tin tức đã được cập nhật từ máy chủ.',
      });
    } catch (error) {
      showToast({ type: 'error', title: 'Làm mới thất bại', message: error.message });
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
            online={online}
            loading={state.loading || manualRefreshing}
            onRefresh={reloadAll}
          />
          <LiveTicker />
        </Animated.View>
      )}

      {!showChart && (
        <ConnectivityStrip online={online} justReturned={justReturned} />
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

      {!updateVersion && (canInstall || showIosGuide) && (
        <View style={styles.installCard}>
          <View style={styles.installRow}>
            <View style={styles.installIconWrap}>
              <DownloadIcon size={19} color={COLORS.primary} strokeWidth={2} />
            </View>
            <TouchableOpacity
              style={styles.installBody}
              onPress={install}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.installTitle}>Cài đặt MacroPulse</Text>
              <Text style={styles.installSub} numberOfLines={2}>
                {showIosGuide
                  ? 'iOS: mở menu Chia sẻ › Thêm vào Màn hình chính'
                  : 'Dùng như ứng dụng riêng, offline và nhận cập nhật'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.installDismiss}
              onPress={dismiss}
              hitSlop={8}
              accessibilityLabel="Bỏ qua cài đặt"
            >
              <XIcon size={14} color={COLORS.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {updateVersion && (
        <View style={styles.updateCard}>
          <View style={styles.updateTextWrap}>
            <Text style={styles.updateTitle}>Phiên bản mới đã sẵn sàng</Text>
            <Text style={styles.updateSub} numberOfLines={1}>
              Cập nhật {updateVersion} — nhận tính năng và sửa lỗi mới nhất
            </Text>
          </View>
          <TouchableOpacity style={styles.updateApply} onPress={applyUpdate} activeOpacity={0.85}>
            <Text style={styles.updateApplyText}>Cập nhật</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.updateLater}
            onPress={laterUpdate}
            activeOpacity={0.7}
            hitSlop={4}
          >
            <Text style={styles.updateLaterText}>Để sau</Text>
          </TouchableOpacity>
        </View>
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

      {showSplash && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#05070A',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
              opacity: splashOpacity,
            },
          ]}
        >
          <PulseLogo size={50} showText={true} scale={1.8} />
          <Text style={{ color: '#4A5568', marginTop: 24, fontSize: 13, fontFamily: FONT_FAMILY, letterSpacing: 1 }}>
            TẢI DỮ LIỆU...
          </Text>
        </Animated.View>
      )}
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
    backgroundColor: '#05070A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tabTopGlow: { display: 'none' },
  navReveal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
    zIndex: 200,
  },
  navRevealBar: {
    width: 32,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabItemInner: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  tabGlow: { display: 'none' },
  activeDot: {
    position: 'absolute',
    top: -8,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: COLORS.primary,
  },
  tabItemActive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    color: TAB_INACTIVE,
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 3,
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  badgeDot: {
    position: 'absolute',
    top: 1,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.important,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: COLORS.important,
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
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
    backgroundColor: 'rgba(5, 7, 10, 0.95)',
    backdropFilter: 'blur(20px)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.10)',
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#F0F4F8',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    color: '#F0F4F8',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    fontFamily: FONT_FAMILY,
  },
  externalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.30)',
  },
  externalText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  modalSpacer: {
    width: 32,
  },
  installCard: {
    position: 'absolute',
    right: 14,
    bottom: 90,
    maxWidth: 330,
    backgroundColor: 'rgba(9, 12, 18, 0.97)',
    backdropFilter: 'blur(16px)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    shadowColor: '#00D4FF',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  installRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  installBody: {
    flex: 1,
    minWidth: 0,
  },
  connStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 896,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(5, 7, 10, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.07)',
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  connText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  updateCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 90,
    alignSelf: 'center',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 12, 18, 0.98)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.28)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
    shadowColor: '#00D4FF',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  updateTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  updateTitle: {
    color: '#F0F4F8',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  updateSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  updateApply: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  updateApplyText: {
    color: '#05070A',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  updateLater: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 2,
  },
  updateLaterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  installDismiss: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  installIconWrap: {
    marginRight: 10,
  },
  installTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  installSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
});