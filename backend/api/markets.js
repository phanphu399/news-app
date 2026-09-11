const SYMBOLS = [
  { symbol: 'GC=F', name: 'Vàng', unit: 'USD/oz' },
  { symbol: 'SI=F', name: 'Bạc', unit: 'USD/oz' },
];
const TTL_MS = 60 * 1000;
const CACHE_MAX_AGE = 60;

let cache = { at: 0, payload: null };

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
}

export default async function handler(request, response) {
  cors(response);
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'GET') {
    return response.status(405).json({ ok: false, error: 'Method phải là GET' });
  }

  const now = Date.now();
  if (cache.payload && now - cache.at < TTL_MS) {
    return response.status(200).json({ ok: true, cached: true, markets: cache.payload });
  }

  try {
    const markets = {};
    await Promise.all(
      SYMBOLS.map(async ({ symbol, name, unit }) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (news-app markets proxy)' },
              signal: AbortSignal.timeout(8000),
            }
          );
          if (!res.ok) return;
          const json = await res.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (!meta) return;
          const price = Number(meta.regularMarketPrice);
          const prevClose = Number(meta.previousClose ?? meta.chartPreviousClose ?? NaN);
          if (!Number.isFinite(price)) return;
          const isFinitePrev = Number.isFinite(prevClose) && prevClose > 0;
          const change = isFinitePrev ? price - prevClose : null;
          markets[symbol] = {
            symbol,
            name,
            unit,
            price,
            prevClose: isFinitePrev ? prevClose : null,
            change,
            changePct: change != null ? (change / prevClose) * 100 : null,
            updatedAt: meta.regularMarketTime
              ? new Date(meta.regularMarketTime * 1000).toISOString()
              : new Date().toISOString(),
          };
        } catch {
          /* keep missing entry */
        }
      })
    );

    if (Object.keys(markets).length === 0) throw new Error('Không lấy được giá kim loại');

    cache = { at: now, payload: markets };
    return response.status(200).json({ ok: true, cached: false, markets });
  } catch (error) {
    if (cache.payload) {
      return response.status(200).json({ ok: true, cached: true, stale: true, markets: cache.payload });
    }
    console.error('[markets]', error.message);
    return response.status(502).json({ ok: false, error: 'Không tải được giá vàng/bạc, thử lại sau.' });
  }
}