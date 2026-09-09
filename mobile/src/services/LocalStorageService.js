import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_FEEDS_KEY = '@aster/custom_feeds';
const LAST_READ_KEY = '@aster/last_read_at';

export const LocalStorageService = {
  async getCustomFeeds() {
    const raw = await AsyncStorage.getItem(CUSTOM_FEEDS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async addCustomFeed(feed) {
    const feeds = await this.getCustomFeeds();
    const next = [
      {
        id: `${Date.now()}`,
        name: feed.name,
        rssUrl: feed.rssUrl,
        source: feed.source || 'Custom',
        createdAt: new Date().toISOString(),
      },
      ...feeds,
    ];
    await AsyncStorage.setItem(CUSTOM_FEEDS_KEY, JSON.stringify(next));
    return next[0];
  },

  async removeCustomFeed(id) {
    const feeds = await this.getCustomFeeds();
    const next = feeds.filter((feed) => feed.id !== id);
    await AsyncStorage.setItem(CUSTOM_FEEDS_KEY, JSON.stringify(next));
    return next;
  },

  async clearCustomFeeds() {
    await AsyncStorage.removeItem(CUSTOM_FEEDS_KEY);
  },

  async getLastReadAt() {
    const raw = await AsyncStorage.getItem(LAST_READ_KEY);
    return raw ? parseInt(raw, 10) : 0;
  },

  async setLastReadAt(timestamp = Date.now()) {
    await AsyncStorage.setItem(LAST_READ_KEY, String(timestamp));
  },
};