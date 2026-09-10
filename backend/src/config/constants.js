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
  'NFP',
  'NONFARM',
  'XAUUSD',
  'GOLD',
  'OIL',
  'CRUDE',
  'WAR',
  'ATTACK',
  'STRIKE',
  'MISSILE',
  'NUCLEAR',
  'SANCTION',
  'RECESSION',
  'RATE CUT',
  'RATE HIKE',
  'INTEREST RATE',
  'FED FUNDS',
  'GDP',
  'UNEMPLOYMENT',
  'GEOPOLITICAL',
  'INVASION',
  'DEFAULT',
  'CRISIS',
  'COLLAPSE',
  'TREASURY',
  'INFLATION',
  'BITCOIN',
  'BTC',
  'TARIFF',
  'TRUMP',
  'YEN',
  'YUAN',
  'DOLLAR INDEX',
  'DXY',
];

export const FED_MACRO_QUERIES = [
  { q: 'Federal Reserve FOMC interest rate decision', c: 'Macro' },
  { q: 'Powell Fed speech rate cut', c: 'Macro' },
  { q: 'CPI inflation report US', c: 'Macro' },
  { q: 'PPI producer price index US', c: 'Macro' },
  { q: 'nonfarm payrolls NFP jobs report', c: 'Macro' },
  { q: 'Fed funds rate expectations', c: 'Macro' },
  { q: 'Trump tariff announcement markets', c: 'Macro' },
  { q: 'Trump trade policy stocks dollar', c: 'Macro' },
];

export const GEOPOLITICS_QUERIES = [
  { q: 'war conflict escalation markets', c: 'Geopolitics' },
  { q: 'Russia Ukraine war latest', c: 'Geopolitics' },
  { q: 'Middle East Iran Israel conflict oil', c: 'Geopolitics' },
  { q: 'Red Sea shipping attacks', c: 'Geopolitics' },
  { q: 'Taiwan China military tension', c: 'Geopolitics' },
  { q: 'missile strike gold oil price', c: 'Geopolitics' },
];

export const GOLD_OIL_QUERIES = [
  { q: 'XAUUSD gold price today', c: 'XAUUSD' },
  { q: 'crude oil WTI Brent price', c: 'XAUUSD' },
  { q: 'gold safe haven dollar', c: 'XAUUSD' },
];

export const FOREX_QUERIES = [
  { q: 'USD JPY yen exchange rate', c: 'Forex' },
  { q: 'USD CNY yuan exchange rate', c: 'Forex' },
  { q: 'dollar index DXY', c: 'Forex' },
  { q: 'EUR USD euro exchange rate', c: 'Forex' },
];

export const CRYPTO_QUERIES = [
  { q: 'Bitcoin BTC price', c: 'Crypto' },
  { q: 'cryptocurrency market Trump', c: 'Crypto' },
  { q: 'Ethereum crypto price', c: 'Crypto' },
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
