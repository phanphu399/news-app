import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import NewsViewModel from './src/viewmodels/NewsViewModel';
import NewsListView from './src/views/NewsListView';
import NewsWebView from './src/views/NewsWebView';
import EconomicCalendarView from './src/views/EconomicCalendarView';
import CustomFeedView from './src/views/CustomFeedView';
import TradingViewScreen from './src/views/TradingViewScreen';
import AppHeader from './src/views/AppHeader';
import { COLORS } from './src/config/constants';

const TABS = {
  NEWS: 'news',
  GOLD: 'gold',
  CALENDAR: 'calendar',
  FEEDS: 'feeds',
};

function TabBar({ active, onChange, insets }) {
  const tabs = [
    { key: TABS.NEWS, label: 'Tin nóng', icon: '🔥' },
    { key: TABS.GOLD, label: 'Vàng XAU', icon: '🪙' },
    { key: TABS.CALENDAR, label: 'Lịch KT', icon: '📅' },
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
  const [openedUrl, setOpenedUrl] = useState(null);
  const viewModelRef = useRef(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new NewsViewModel();
  }
  const vm = viewModelRef.current;

  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const unsubscribe = vm.subscribe((nextState) => setState(nextState));
    vm.start();
    return () => {
      unsubscribe();
      vm.stop();
    };
  }, []);

  const connected = !state.error;

  const openArticle = (url) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    setOpenedUrl(url);
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
            onItemPress={(item) => openArticle(item.url)}
            onRefresh={() => vm.refresh()}
          />
        )}
        {activeTab === TABS.GOLD && <TradingViewScreen />}
        {activeTab === TABS.CALENDAR && <EconomicCalendarView />}
        {activeTab === TABS.FEEDS && (
          <CustomFeedView onAdded={() => vm.refresh()} onOpenArticle={openArticle} />
        )}
      </View>

      <TabBar active={activeTab} onChange={setActiveTab} insets={insets} />

      {canInstall && (
        <TouchableOpacity style={styles.installButton} onPress={install} activeOpacity={0.85}>
          <Text style={styles.installIcon}>⬇</Text>
          <View>
            <Text style={styles.installTitle}>Cài đặt ASTER</Text>
            <Text style={styles.installSub}>Dùng như ứng dụng riêng</Text>
          </View>
        </TouchableOpacity>
      )}

      <Modal visible={Boolean(openedUrl)} onRequestClose={() => setOpenedUrl(null)} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setOpenedUrl(null)}>
              <Text style={styles.closeButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đang mở bài viết</Text>
            <View style={styles.modalSpacer} />
          </View>
          {openedUrl ? <NewsWebView url={openedUrl} /> : null}
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