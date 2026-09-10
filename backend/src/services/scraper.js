import { XMLParser } from 'fast-xml-parser';
import {
  DIRECT_RSS_FEEDS,
  EXTRA_FEEDS,
  FED_MACRO_QUERIES,
  GEOPOLITICS_QUERIES,
  GOLD_OIL_QUERIES,
  FOREX_QUERIES,
  CRYPTO_QUERIES,
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

function buildGoogleNewsFeeds() {
  const tagQueries = (entries, category) =>
    entries.map((query) => ({ query, category }));
  const queries = [
    ...tagQueries(FED_MACRO_QUERIES.map((q) => q.q), 'Macro'),
    ...tagQueries(GEOPOLITICS_QUERIES.map((q) => q.q), 'Geopolitics'),
    ...tagQueries(GOLD_OIL_QUERIES.map((q) => q.q), 'XAUUSD'),
    ...tagQueries(FOREX_QUERIES.map((q) => q.q), 'Forex'),
    ...tagQueries(CRYPTO_QUERIES.map((q) => q.q), 'Crypto'),
    ...PAYWALL_QUERIES.map((query) => ({ query, category: 'Paywall' })),
  ];

  return queries.map(({ query, category }) => ({
    url: googleNewsQueryUrl(query),
    category,
    source: KNOWN_SOURCES.GOOGLE_NEWS,
  }));
}

function detectSource(feedUrl) {
  if (feedUrl.includes('yahoo')) return KNOWN_SOURCES.YAHOO_FINANCE;
  if (feedUrl.includes('cnbc')) return KNOWN_SOURCES.CNBC;
  if (feedUrl.includes('whitehouse')) return KNOWN_SOURCES.WHITE_HOUSE;
  if (feedUrl.includes('dowjones') || feedUrl.includes('mw_')) return 'MarketWatch';
  if (feedUrl.includes('oilprice')) return 'OilPrice';
  return KNOWN_SOURCES.GOOGLE_NEWS;
}

function buildFeedSets() {
  const googleFeeds = buildGoogleNewsFeeds();
  const directFeeds = DIRECT_RSS_FEEDS.map((url) => ({
    url,
    category: 'Macro',
    source: detectSource(url),
  }));
  const extraFeeds = EXTRA_FEEDS.map((feed) => ({
    url: feed.url,
    category: feed.category || 'Macro',
    source: feed.source || detectSource(feed.url),
    maxAgeHours: feed.maxAgeHours,
  }));
  return [...googleFeeds, ...directFeeds, ...extraFeeds];
}

async function fetchFeedOnce(feed) {
  const response = await fetch(feed.url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Feed ${feed.url} responded with ${response.status}`);
  }

  const xml = await response.text();
  const parsed = xmlParser.parse(xml);

  const text = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value['#text'] ?? value['@_href'] ?? '';
    }
    return '';
  };

  const channel = parsed?.rss?.channel;
  const rdfChannel = parsed?.['rdf:RDF']?.channel;
  const atomFeed = parsed?.feed;

  const rssItems = channel && Array.isArray(channel.item) ? channel.item : [];
  const rdfItemList = parsed?.['rdf:RDF']?.item;
  const rdfItems =
    rdfItemList == null ? [] : Array.isArray(rdfItemList) ? rdfItemList : [rdfItemList];
  const atomItems = atomFeed && Array.isArray(atomFeed.entry) ? atomFeed.entry : [];

  const entries = [...rssItems, ...rdfItems, ...atomItems].slice(0, MAX_ITEMS_PER_FEED);

  return entries.map((entry) => {
    const rawUrl =
      text(entry.link) ||
      text(entry.guid) ||
      (typeof entry.link === 'object' ? text(entry.link['@_href']) : '') ||
      (Array.isArray(entry.link) ? text(entry.link[0]?.['@_href']) : '');
    const url = normalizeUrl(rawUrl);
    const title = sanitizeTitle(text(entry.title));

    return {
      id: hashUrl(`google|${url}`),
      title,
      source: feed.source || KNOWN_SOURCES.GOOGLE_NEWS,
      url,
      category: feed.category || 'Macro',
      is_important: isRedAlert(title),
      published_at: parseIsoDate(
        text(entry.pubDate) ||
          text(entry.published) ||
          text(entry.updated) ||
          text(entry.date) ||
          text(entry['dc:date'])
      ),
    };
  });
}

export async function fetchFeed(feed, attempt = 1) {
  try {
    return await fetchFeedOnce(feed);
  } catch (error) {
    if (attempt < 3 && /(40[0-9]|429|timeout|abort)/i.test(String(error.message))) {
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      return fetchFeed(feed, attempt + 1);
    }
    throw error;
  }
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

function filterFresh(items, maxAgeHours = 24) {
  const now = Date.now();
  return items.filter((item) => {
    const published = new Date(item.published_at).getTime();
    const ageHours = (now - published) / (1000 * 60 * 60);
    return ageHours >= 0 && ageHours <= maxAgeHours;
  });
}

export async function scrapeAll() {
  const feeds = buildFeedSets();
  const tasks = feeds.map((feed) =>
    fetchFeed(feed).then((items) => filterFresh(items, feed.maxAgeHours ?? 24)).catch(() => [])
  );
  const results = await Promise.all(tasks);
  const flattened = results.flat();
  const unique = dedupe(flattened);
  return unique;
}
