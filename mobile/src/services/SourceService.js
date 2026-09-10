import { BACKEND_URL } from '../config/constants';

const FEEDS_ENDPOINT = `${BACKEND_URL}/api/user-feeds`;

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

export async function triggerManualFetch() {
  const endpoint = `${BACKEND_URL}/api/manual-fetch`;
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(90000),
    headers: { Accept: 'application/json' },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.ok) throw new Error(json?.error || `HTTP ${response.status}`);
  return json;
}

export async function addUserFeed({ name, rssUrl, category }) {
  const response = await fetch(FEEDS_ENDPOINT, {
    method: 'POST',
    signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, rssUrl, category }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${response.status}`);
  }
  return json.feed;
}

export async function updateUserFeed(id, { name, rssUrl, category, enabled }) {
  const response = await fetch(`${FEEDS_ENDPOINT}?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, rssUrl, category, enabled }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${response.status}`);
  }
  return json.feed;
}

export async function testUserFeed(rssUrl) {
  const response = await fetch(`${FEEDS_ENDPOINT}?action=test`, {
    method: 'POST',
    signal: AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rssUrl }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${response.status}`);
  }
  return json;
}

export async function removeUserFeed(id) {
  const response = await fetch(`${FEEDS_ENDPOINT}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(15000),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${response.status}`);
  }
  return true;
}

export function sourcesFromItems(items) {
  const map = new Map();
  for (const item of items) {
    const source = item.source || 'Unknown';
    if (!map.has(source)) {
      map.set(source, {
        source,
        url: '',
        categories: new Set(),
        count24h: 0,
        healthy: null,
        error: '',
        userFeedId: null,
        enabled: true,
      });
    }
    const entry = map.get(source);
    entry.count24h += 1;
    if (item.category) entry.categories.add(item.category);
  }
  return [...map.values()]
    .map((entry) => ({ ...entry, categories: [...entry.categories] }))
    .sort((a, b) => b.count24h - a.count24h);
}