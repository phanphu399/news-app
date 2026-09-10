export const KNOWN_SOURCES = {
  YAHOO_FINANCE: 'Yahoo Finance',
  CNBC: 'CNBC',
  WHITE_HOUSE: 'White House',
  GOOGLE_NEWS: 'Google News',
  BLOOMBERG: 'Bloomberg',
  WSJ: 'WSJ',
  REUTERS: 'Reuters',
};

export const RED_ALERT_KEYWORDS = [
  'FED',
  'FOMC',
  'CPI',
  'PPI',
  'XAUUSD',
  'GOLD',
  'OIL',
  'CRUDE',
  'WAR',
  'ATTACK',
  'NUCLEAR',
  'SANCTION',
  'RECESSION',
  'RATE CUT',
  'RATE HIKE',
  'INTEREST RATE',
  'GDP',
  'NFP',
  'NONFARM',
  'UNEMPLOYMENT',
  'GEOPOLITICAL',
  'INVASION',
  'DEFAULT',
  'CRISIS',
  'COLLAPSE',
  'TREASURY',
  'INFLATION',
];

export const MACRO_QUERIES = [
  'FED FOMC interest rate',
  'CPI inflation report',
  'Federal Reserve Powell speech',
  'US economic data',
  'GDP growth forecast',
];

export const COMMODITY_QUERIES = [
  'XAUUSD gold price',
  'crude oil WTI Brent',
  'commodities market today',
];

export const PAYWALL_QUERIES = [
  'site:bloomberg.com markets',
  'site:wsj.com markets finance',
  'site:reuters.com markets',
];

export const DIRECT_RSS_FEEDS = [
  'https://finance.yahoo.com/news/rssindex',
  'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  'https://feeds.content.dowjones.io/public/rss/mw_topstories',
  'https://oilprice.com/rss/main',
];

export const EXTRA_FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=site:whitehouse.gov&hl=en-US&gl=US&ceid=US:en',
    source: KNOWN_SOURCES.WHITE_HOUSE,
    category: 'Macro',
  },
];

export const CACHE_TTL_HOURS = 1;
export const MAX_ITEMS_PER_FEED = 20;
