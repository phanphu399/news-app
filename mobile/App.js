import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NewsViewModel from './src/viewmodels/NewsViewModel';
import NewsListView from './src/views/NewsListView';
import NewsWebView from './src/views/NewsWebView';
import EconomicCalendarView from './src/views/EconomicCalendarView';
import CustomFeedView from './src/views/CustomFeedView';
import { BACKGROUND_COLOR, TEXT_PRIMARY, TEXT_SECONDARY } from './src/config/constants';

const TABS = {
  NEWS: 'news',
  CALENDAR: 'calendar',
  FEEDS: 'feeds',
};

function TabBar({ active, onChange, insets }) {
  const tabs = [
    { key: TABS.NEWS, label: 'Tin nóng' },
    { key: TABS.CALENDAR, label: 'Lịch KT' },
    { key: TABS.FEEDS, label: 'Feeds' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tabItem}
          onPress={() => onChange(tab.key)}
        >
          <Text style={[styles.tabLabel, active === tab.key && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_COLOR} />

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

      <TabBar active={activeTab} onChange={setActiveTab} insets={insets} />

      <Modal
        visible={Boolean(openedUrl)}
        onRequestClose={() => setOpenedUrl(null)}
        animationType="slide"
      >
        <View style={styles.modal}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setOpenedUrl(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đang mở bài viết...</Text>
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
    backgroundColor: BACKGROUND_COLOR,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#38bdf8',
  },
  modal: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 14,
  },
  modalTitle: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});