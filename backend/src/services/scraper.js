import { XMLParser } from 'fast-xml-parser';
import {
  DIRECT_RSS_FEEDS,
  MACRO_QUERIES,
  COMMODITY_QUERIES,
  PAYWALL_QUERIES,
  MAX_ITEMS_PER_FEED,
  KNOWN_SOURCES,
} from '../config/constants.js';
import {
  hashUrl,
  isRedAlert,
  normalizeUrl,
  sanitizeTitle,
  parseIsoDate,
} from '../utils/helpers.js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

function googleNewsQueryUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

function categorizeQuery(query) {
  const lower = query.toLowerCase();
  if (
    lower.includes('gold') ||
    lower.includes('xau') ||
    lower.includes('oil') ||
    lower.includes('crude') ||
    lower.includes('commodit')
  ) {
    return 'XAUUSD';
  }
  if (lower.includes('bloomberg') || lower.includes('wsj') || lower.includes('reuters')) {
    return 'Paywall';
  }
  return 'Macro';
}

function buildGoogleNewsFeeds() {
  const queries = [...MACRO_QUERIES, ...COMMODITY_QUERIES, ...PAYWALL_QUERIES];
  return queries.map((query) => ({
    url: googleNewsQueryUrl(query),
    category: categorizeQuery(query),
    source: KNOWN_SOURCES.GOOGLE_NEWS,
  }));
}

function detectSource(feedUrl) {
  if (feedUrl.includes('yahoo')) return KNOWN_SOURCES.YAHOO_FINANCE;
  if (feedUrl.includes('cnbc')) return KNOWN_SOURCES.CNBC;
  if (feedUrl.includes('whitehouse')) return KNOWN_SOURCES.WHITE_HOUSE;
  return KNOWN_SOURCES.GOOGLE_NEWS;
}

function buildFeedSets() {
  const googleFeeds = buildGoogleNewsFeeds();
  const directFeeds = DIRECT_RSS_FEEDS.map((url) => ({
    url,
    category: 'Macro',
    source: detectSource(url),
  }));
  return [...googleFeeds, ...directFeeds];
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Feed ${feed.url} responded with ${response.status}`);
  }

  const xml = await response.text();
  const parsed = xmlParser.parse(xml);
  const channel = parsed?.rss?.channel;
  if (!channel || !Array.isArray(channel.item)) {
    return [];
  }

  return channel.item.slice(0, MAX_ITEMS_PER_FEED).map((item) => {
    const rawUrl = item.link || item.guid?.['#text'] || item.guid || '';
    const url = normalizeUrl(rawUrl);
    const title = sanitizeTitle(String(item.title || ''));

    return {
      id: hashUrl(`google|${url}`),
      title,
      source: feed.source || KNOWN_SOURCES.GOOGLE_NEWS,
      url,
      category: feed.category || 'Macro',
      is_important: isRedAlert(title),
      published_at: parseIsoDate(item.pubDate || item.published),
    };
  });
}

function dedupe(items) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!item.url || seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

function filterFresh(items) {
  const now = Date.now();
  return items.filter((item) => {
    const published = new Date(item.published_at).getTime();
    const ageHours = (now - published) / (1000 * 60 * 60);
    return ageHours >= 0 && ageHours <= 24;
  });
}

export async function scrapeAll() {
  const feeds = buildFeedSets();
  const tasks = feeds.map((feed) => fetchFeed(feed).catch(() => []));
  const results = await Promise.all(tasks);
  const flattened = results.flat();
  const unique = dedupe(flattened);
  return filterFresh(unique);
}
