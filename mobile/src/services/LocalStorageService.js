import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CUSTOM_FEEDS_KEY = '@aster/custom_feeds';
const LAST_READ_KEY = '@aster/last_read_at';
const WATCH_KEYWORDS_KEY = '@aster/watch_keywords';
const BOOKMARKS_KEY = '@aster/bookmarks';

const isWeb = Platform.OS === 'web';

function webGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function webSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage full / unavailable */
  }
}

function webRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

async function readItem(key) {
  if (isWeb) return webGet(key);
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeItem(key, value) {
  if (isWeb) {
    webSet(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function removeItem(key) {
  if (isWeb) {
    webRemove(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export const LocalStorageService = {
  async getCustomFeeds() {
    const raw = await readItem(CUSTOM_FEEDS_KEY);
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
    await writeItem(CUSTOM_FEEDS_KEY, JSON.stringify(next));
    return next[0];
  },

  async removeCustomFeed(id) {
    const feeds = await this.getCustomFeeds();
    const next = feeds.filter((feed) => feed.id !== id);
    await writeItem(CUSTOM_FEEDS_KEY, JSON.stringify(next));
    return next;
  },

  async clearCustomFeeds() {
    await removeItem(CUSTOM_FEEDS_KEY);
  },

  async getLastReadAt() {
    const raw = await readItem(LAST_READ_KEY);
    return raw ? parseInt(raw, 10) : 0;
  },

  async setLastReadAt(timestamp = Date.now()) {
    await writeItem(LAST_READ_KEY, String(timestamp));
  },

  async getWatchKeywords() {
    const raw = await readItem(WATCH_KEYWORDS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string' && k.trim()) : [];
    } catch {
      return [];
    }
  },

  async setWatchKeywords(keywords) {
    await writeItem(WATCH_KEYWORDS_KEY, JSON.stringify(keywords));
  },

  async getBookmarks() {
    const raw = await readItem(BOOKMARKS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async addBookmark(item) {
    const bookmarks = await this.getBookmarks();
    if (bookmarks.some((bookmark) => bookmark.id === item.id)) return bookmarks;
    const next = [item, ...bookmarks];
    await writeItem(BOOKMARKS_KEY, JSON.stringify(next));
    return next;
  },

  async removeBookmark(id) {
    const bookmarks = await this.getBookmarks();
    const next = bookmarks.filter((bookmark) => bookmark.id !== id);
    await writeItem(BOOKMARKS_KEY, JSON.stringify(next));
    return next;
  },
};