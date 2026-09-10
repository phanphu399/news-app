import { createClient } from '@supabase/supabase-js';
import {
  DIRECT_RSS_FEEDS,
  MACRO_QUERIES,
  COMMODITY_QUERIES,
  KNOWN_SOURCES,
} from '../src/config/constants.js';

const HEALTH_TTL_MS = 5 * 60 * 1000;
const healthCache = new Map();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const client = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function detectSource(feedUrl) {
  if (feedUrl.includes('yahoo')) return KNOWN_SOURCES.YAHOO_FINANCE;
  if (feedUrl.includes('cnbc')) return KNOWN_SOURCES.CNBC;
  if (feedUrl.includes('whitehouse')) return KNOWN_SOURCES.WHITE_HOUSE;
  if (feedUrl.includes('dowjones') || feedUrl.includes('mw_')) return 'MarketWatch';
  if (feedUrl.includes('oilprice')) return 'OilPrice';
  return KNOWN_SOURCES.GOOGLE_NEWS;
}

function buildSourceList() {
  const sources = DIRECT_RSS_FEEDS.map((url) => ({
    source: detectSource(url),
    url,
    categories: ['Macro'],
  }));

  sources.push({
    source: KNOWN_SOURCES.GOOGLE_NEWS,
    url: 'https://news.google.com/rss/search?q=markets&hl=en-US&gl=US&ceid=US:en',
    categories: ['Macro', 'XAUUSD'],
  });

  return sources;
}

async function checkHealth(source) {
  const now = Date.now();
  const cached = healthCache.get(source.source);
  if (cached && now - cached.at < HEALTH_TTL_MS) {
    return { healthy: cached.healthy, error: cached.error };
  }

  let healthy = false;
  let error = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timer);
    healthy = res.ok && res.status < 400;
    if (!healthy) error = `HTTP ${res.status}`;
  } catch (err) {
    error = err.name === 'AbortError' ? 'Timeout' : err.message;
  }

  healthCache.set(source.source, { at: now, healthy, error });
  return { healthy, error };
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (request.method === 'OPTIONS') return response.status(204).end();

  const sourceList = buildSourceList();

  const counts = new Map();
  if (client) {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await client
        .from('market_news')
        .select('source')
        .gte('published_at', since)
        .limit(5000);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const key = row.source || 'Unknown';
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
    } catch {
      /* counts best-effort */
    }
  }

  const results = await Promise.all(
    sourceList.map(async (source) => {
      const health = await checkHealth(source);
      return {
        source: source.source,
        url: source.url,
        categories: source.categories,
        healthy: health.healthy,
        error: health.error,
        count24h: counts.get(source.source) || 0,
      };
    })
  );

  response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
  return response.status(200).json({
    ok: true,
    fetchedAt: new Date().toISOString(),
    sources: results.sort((a, b) => b.count24h - a.count24h),
  });
}