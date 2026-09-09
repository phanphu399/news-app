import { Platform } from 'react-native';
import { LocalStorageService } from './LocalStorageService';
import NewsModel from '../models/NewsModel';
import { BACKEND_URL } from '../config/constants';

function proxyUrl(feed) {
  const encoded = encodeURIComponent(feed.rssUrl);
  if (Platform.OS === 'web' && typeof location !== 'undefined') {
    return `/api/rss-proxy?url=${encoded}`;
  }
  return `${BACKEND_URL}/api/rss-proxy?url=${encoded}`;
}

export async function fetchCustomFeed(feed) {
  const response = await fetch(proxyUrl(feed), { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`Proxy responded with ${response.status}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }

  const items = Array.isArray(json.items) ? json.items : [];
  return items.slice(0, 12).map((item) =>
    NewsModel.fromCustomFeed({
      title: String(item.title || '').trim(),
      url: item.url || '',
      source: feed.source || 'Custom',
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
    })
  );
}

export const CustomFeedService = {
  async getUserFeeds() {
    return LocalStorageService.getCustomFeeds();
  },

  async addUserFeed({ name, rssUrl, source }) {
    return LocalStorageService.addCustomFeed({ name, rssUrl, source });
  },

  async removeUserFeed(id) {
    return LocalStorageService.removeCustomFeed(id);
  },

  async fetchFeed(feed) {
    return fetchCustomFeed(feed);
  },

  async fetchAll() {
    const feeds = await this.getUserFeeds();
    const results = await Promise.all(feeds.map((feed) => fetchCustomFeed(feed).catch(() => [])));
    return results.flat().sort((a, b) => b.publishedAt - a.publishedAt);
  },
};