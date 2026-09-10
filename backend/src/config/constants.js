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

export const HOT_GOOGLE_QUERIES = new Set([
  'Federal Reserve FOMC interest rate decision',
  'Powell Fed speech rate cut',
  'CPI inflation report US',
  'nonfarm payrolls NFP jobs report',
  'Trump tariff announcement markets',
]);

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

export const HOT_DIRECT_RSS_FEEDS = new Set([
  'https://finance.yahoo.com/news/rssindex',
  'https://www.cnbc.com/id/100003114/device/rss/rss.html',
]);

export const EXTRA_FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=site:whitehouse.gov&hl=en-US&gl=US&ceid=US:en',
    source: KNOWN_SOURCES.WHITE_HOUSE,
    category: 'Macro',
  },
  {
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    source: 'Federal Reserve',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/press_monetary.xml',
    source: 'Federal Reserve',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/speeches_and_testimony.xml',
    source: 'Federal Reserve',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/s_t_powell.xml',
    source: 'Fed Powell',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/boardmeetings.xml',
    source: 'Federal Reserve',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/prates.xml',
    source: 'Fed Policy Rates',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/h15.xml',
    source: 'Fed Interest Rates',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/h10.xml',
    source: 'Fed FX Rates',
    category: 'Forex',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/h41.xml',
    source: 'Fed Balance Sheet',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/g17.xml',
    source: 'Fed Industrial Production',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/z1.xml',
    source: 'Fed Financial Accounts',
    category: 'Macro',
    maxAgeHours: 24 * 7,
  },
  {
    url: 'https://www.forexfactory.com/news.xml',
    source: 'ForexFactory',
    category: 'Forex',
    hot: true,
  },
  {
    url: 'https://www.investing.com/rss/news_285.rss',
    source: 'Investing.com',
    category: 'Macro',
    hot: true,
  },
];

export const CACHE_TTL_HOURS = 1;
export const MAX_ITEMS_PER_FEED = 20;
