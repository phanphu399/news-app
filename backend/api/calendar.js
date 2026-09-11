const TARGET = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_AGE = 300;

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
  if (cache.payload && now - cache.at < CACHE_TTL_MS) {
    return response.status(200).json({ ok: true, cached: true, events: cache.payload });
  }

  try {
    const res = await fetch(TARGET, {
      headers: { 'User-Agent': 'Mozilla/5.0 (news-app calendar proxy)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Nguồn calendar trả HTTP ${res.status}`);
    const raw = await res.json();

    const events = (Array.isArray(raw) ? raw : [])
      .filter((e) => e && typeof e === 'object')
      .filter((e) => ['High', 'Medium', 'Low'].includes(e.impact))
      .map((e) => ({
        title: String(e.title || '').trim(),
        country: String(e.country || '').toUpperCase(),
        date: e.date || null,
        impact: e.impact,
        forecast: String(e.forecast ?? '').trim(),
        previous: String(e.previous ?? '').trim(),
        actual: e.actual != null && e.actual !== '' ? String(e.actual) : '',
        unit: String(e.unit ?? '').trim(),
      }))
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    cache = { at: now, payload: events };
    return response.status(200).json({ ok: true, cached: false, events });
  } catch (error) {
    if (cache.payload) {
      return response.status(200).json({ ok: true, cached: true, stale: true, events: cache.payload });
    }
    console.error('[calendar]', error.message);
    return response.status(502).json({ ok: false, error: 'Không tải được lịch kinh tế, thử lại sau.' });
  }
}