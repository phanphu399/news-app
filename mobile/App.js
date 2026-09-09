import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import NewsViewModel from './src/viewmodels/NewsViewModel';
import NewsListView from './src/views/NewsListView';
import NewsWebView from './src/views/NewsWebView';
import EconomicCalendarView from './src/views/EconomicCalendarView';
import CustomFeedView from './src/views/CustomFeedView';
import AppHeader from './src/views/AppHeader';
import { COLORS } from './src/config/constants';

const TABS = {
  NEWS: 'news',
  CALENDAR: 'calendar',
  FEEDS: 'feeds',
};

function TabBar({ active, onChange, insets }) {
  const tabs = [
    { key: TABS.NEWS, label: 'Tin nóng', icon: '🔥' },
    { key: TABS.CALENDAR, label: 'Lịch KT', icon: '📅' },
    { key: TABS.FEEDS, label: 'Feeds', icon: '⚙️' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => onChange(tab.key)}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <View style={[styles.tabLabelWrap, isActive && styles.tabLabelWrapActive]}>
              <Text style={[styles.tabLabelText, isActive && styles.tabLabelTextActive]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainScreen() {
  const insets = useSafeAreaInsets();
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
            onItemPress={(item) => setOpenedUrl(item.url)}
            onRefresh={() => vm.refresh()}
          />
        )}
        {activeTab === TABS.CALENDAR && <EconomicCalendarView />}
        {activeTab === TABS.FEEDS && <CustomFeedView onAdded={() => vm.refresh()} />}
      </View>

      <TabBar active={activeTab} onChange={setActiveTab} insets={insets} />

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
    paddingTop: 8,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabelWrap: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tabLabelWrapActive: {
    backgroundColor: 'rgba(56,189,248,0.14)',
  },
  tabLabelText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelTextActive: {
    color: COLORS.primary,
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
  modalSpacer: {
    width: 40,
  },
});