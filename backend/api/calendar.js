// CDN (s-maxage) phục vụ request từ mọi client — origin chỉ chạy tối đa 1 lần/30s.
const CACHE_TTL_MS = 30 * 1000;
const CACHE_MAX_AGE = 30;

let cache = { at: 0, payload: null };

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma, Expires');
  response.setHeader(
    'Cache-Control',
    `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE}`
  );
}

function formatVal(val, raw, unit) {
  if (val == null) return '';
  if (unit) return `${val}${unit}`;
  if (val !== 0 && raw) {
    const ratio = Math.abs(raw / val);
    if (ratio === 1000) return `${val}K`;
    if (ratio === 1000000) return `${val}M`;
    if (ratio === 1000000000) return `${val}B`;
    if (ratio === 1000000000000) return `${val}T`;
  }
  return String(val);
}

const impactMap = {
  1: 'High',
  0: 'Medium',
  '-1': 'Low'
};

export default async function handler(request, response) {
  cors(response);
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'GET') {
    return response.status(405).json({ ok: false, error: 'Method must be GET' });
  }

  const now = Date.now();
  if (cache.payload && now - cache.at < CACHE_TTL_MS) {
    return response.status(200).json({ ok: true, cached: true, events: cache.payload });
  }

  try {
    const d = new Date();
    d.setDate(d.getDate() - 3); // 3 days ago
    const fromStr = d.toISOString();
    d.setDate(d.getDate() + 10); // 7 days ahead
    const toStr = d.toISOString();

    const target = `https://economic-calendar.tradingview.com/events?from=${fromStr}&to=${toStr}&countries=US,EU,GB,JP,AU,CA,CH,NZ,CN`;

    const res = await fetch(target, {
      headers: { 
        'User-Agent': 'Mozilla/5.0',
        'origin': 'https://www.tradingview.com'
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`TradingView returned HTTP ${res.status}`);
    const raw = await res.json();
    if (!raw || !raw.result) throw new Error('Invalid TV response');

    const events = raw.result
      .filter((e) => e && impactMap[e.importance])
      .map((e) => ({
        title: String(e.title || '').trim(),
        country: String(e.currency || e.country || '').toUpperCase(),
        date: e.date || null,
        impact: impactMap[e.importance],
        forecast: formatVal(e.forecast, e.forecastRaw, e.unit),
        previous: formatVal(e.previous, e.previousRaw, e.unit),
        actual: formatVal(e.actual, e.actualRaw, e.unit),
      }))
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    cache = { at: now, payload: events };
    return response.status(200).json({ ok: true, cached: false, events });
  } catch (error) {
    if (cache.payload) {
      return response.status(200).json({ ok: true, cached: true, stale: true, events: cache.payload });
    }
    console.error('[calendar]', error.message);
    return response.status(502).json({ ok: false, error: 'Cannot fetch calendar.' });
  }
}