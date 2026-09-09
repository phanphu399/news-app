import { parseStringPromise } from 'fast-xml-parser';
import { LocalStorageService } from './LocalStorageService';
import NewsModel from '../models/NewsModel';

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

async function tryFetch(url) {
  let lastError = null;
  for (const build of CORS_PROXIES) {
    try {
      const response = await fetch(build(url), { signal: AbortSignal.timeout(12000) });
      if (response.ok) {
        return await response.text();
      }
      lastError = new Error(`Status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('All CORS proxies failed');
}

export async function fetchCustomFeed(feed) {
  const xml = await tryFetch(feed.rssUrl);
  const parsed = await parseStringPromise(xml, {
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const channel = parsed?.rss?.channel;
  if (!channel || !Array.isArray(channel.item)) {
    return [];
  }

  return channel.item.slice(0, 10).map((item) =>
    NewsModel.fromCustomFeed({
      title: String(item.title || '').trim(),
      url: item.link || item.guid?.['#text'] || item.guid || '',
      source: feed.source || 'Custom',
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
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

  async fetchAll() {
    const feeds = await this.getUserFeeds();
    const results = await Promise.all(feeds.map((feed) => fetchCustomFeed(feed).catch(() => [])));
    return results.flat().sort((a, b) => b.publishedAt - a.publishedAt);
  },
};