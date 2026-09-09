import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import NewsViewModel from './src/viewmodels/NewsViewModel';
import NewsListView from './src/views/NewsListView';
import NewsArticleView from './src/views/NewsArticleView';
import NewsWebView from './src/views/NewsWebView';
import NotificationToast from './src/views/NotificationToast';
import WatchlistView from './src/views/WatchlistView';
import EconomicCalendarView from './src/views/EconomicCalendarView';
import CustomFeedView from './src/views/CustomFeedView';
import TradingViewScreen from './src/views/TradingViewScreen';
import AppHeader from './src/views/AppHeader';
import { LocalStorageService } from './src/services/LocalStorageService';
import { COLORS } from './src/config/constants';

const TABS = {
  NEWS: 'news',
  GOLD: 'gold',
  CALENDAR: 'calendar',
  FOLLOW: 'follow',
  FEEDS: 'feeds',
};

const TOAST_DURATION_MS = 7000;
const MAX_TOASTS = 3;

function TabBar({ active, onChange, insets, badge }) {
  const tabs = [
    { key: TABS.NEWS, label: 'Tin nóng', icon: '🔥' },
    { key: TABS.GOLD, label: 'Vàng XAU', icon: '🪙' },
    { key: TABS.CALENDAR, label: 'Lịch KT', icon: '📅' },
    { key: TABS.FOLLOW, label: 'Quan tâm', icon: '⭐' },
    { key: TABS.FEEDS, label: 'Nguồn tin', icon: '📡' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            <View style={[styles.tabIndicator, isActive && styles.tabIndicatorActive]} />
            {badge > 0 && tab.key === TABS.NEWS && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
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
  const [openedArticle, setOpenedArticle] = useState(null);
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
    anchor.href = url;
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
    } else {
      await LocalStorageService.addBookmark(item);
      setBookmarks([item, ...bookmarks]);
    }
  };

  const addKeyword = async (keyword) => {
    const next = keywords.includes(keyword) ? keywords : [...keywords, keyword];
    setKeywords(next);
    await LocalStorageService.setWatchKeywords(next);
  };

  const removeKeyword = async (keyword) => {
    const next = keywords.filter((k) => k !== keyword);
    setKeywords(next);
    await LocalStorageService.setWatchKeywords(next);
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <AppHeader connected={connected} loading={state.loading} onRefresh={() => vm.refresh()} />

      <View style={styles.content}>
        {activeTab === TABS.NEWS && (
          <NewsListView
            items={state.items}
            loading={state.loading}
            error={state.error}
            onItemPress={openArticle}
            onRefresh={() => vm.refresh()}
          />
        )}
        {activeTab === TABS.GOLD && <TradingViewScreen />}
        {activeTab === TABS.CALENDAR && <EconomicCalendarView />}
        {activeTab === TABS.FOLLOW && (
          <WatchlistView
            items={state.items}
            keywords={keywords}
            onAddKeyword={addKeyword}
            onRemoveKeyword={removeKeyword}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            onOpenArticle={openArticle}
          />
        )}
        {activeTab === TABS.FEEDS && (
          <CustomFeedView onAdded={() => vm.refresh()} onOpenArticle={openArticle} />
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
      </View>

      <TabBar
        active={activeTab}
        onChange={handleTabChange}
        insets={insets}
        badge={activeTab !== TABS.NEWS ? newCount : 0}
      />

      {canInstall && (
        <TouchableOpacity style={styles.installButton} onPress={install} activeOpacity={0.85}>
          <Text style={styles.installIcon}>⬇</Text>
          <View>
            <Text style={styles.installTitle}>Cài đặt NEWS</Text>
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
    maxWidth: 820,
    alignSelf: 'center',
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0d1119',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    paddingTop: 6,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  tabItemActive: {
    backgroundColor: 'rgba(56,189,248,0.06)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.75,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabIndicator: {
    marginTop: 5,
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: COLORS.primary,
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
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1119',
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
  installIcon: {
    color: COLORS.primary,
    fontSize: 20,
    marginRight: 10,
    fontWeight: '800',
  },
  installTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  installSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
});