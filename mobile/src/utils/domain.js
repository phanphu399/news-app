const KNOWN_DOMAINS = {
  'Yahoo Finance': 'finance.yahoo.com',
  'Yahoo Finance News': 'finance.yahoo.com',
  CNBC: 'cnbc.com',
  MarketWatch: 'marketwatch.com',
  OilPrice: 'oilprice.com',
  'White House': 'whitehouse.gov',
  'Google News': 'news.google.com',
  Bloomberg: 'bloomberg.com',
  Reuters: 'reuters.com',
  'Wall Street Journal': 'wsj.com',
  'Business Insider': 'businessinsider.com',
  ForexLive: 'forexlive.com',
  Investing: 'investing.com',
  'Daily FX': 'dailyfx.com',
  'DailyFX': 'dailyfx.com',
  'FX Street': 'fxstreet.com',
};

export function hostnameOf(url) {
  try {
    const value = /^https?:\/\//i.test(String(url || '')) ? url : `https://${url}`;
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

export function domainForSource(source, feedUrl) {
  if (feedUrl) {
    const host = hostnameOf(feedUrl);
    if (host) return host;
  }
  return KNOWN_DOMAINS[source] || '';
}

export function faviconUrl(source, feedUrl) {
  const domain = domainForSource(source, feedUrl);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}