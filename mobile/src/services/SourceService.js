import { BACKEND_URL } from '../config/constants';

export async function fetchSources() {
  const endpoint = `${BACKEND_URL}/api/sources`;
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(20000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (!json || !json.ok) throw new Error(json?.error || 'Không tải được nguồn tin');
  return json.sources || [];
}

export function sourcesFromItems(items) {
  const map = new Map();
  for (const item of items) {
    const source = item.source || 'Unknown';
    if (!map.has(source)) {
      map.set(source, { source, url: '', categories: new Set(), count24h: 0, healthy: null, error: '' });
    }
    const entry = map.get(source);
    entry.count24h += 1;
    if (item.category) entry.categories.add(item.category);
  }
  return [...map.values()]
    .map((entry) => ({ ...entry, categories: [...entry.categories] }))
    .sort((a, b) => b.count24h - a.count24h);
}