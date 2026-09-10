import { BACKEND_URL } from '../config/constants';
import { normalizeUrl } from '../utils/url';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

function tryFetch(endpoint) {
  return fetch(endpoint, {
    signal: AbortSignal.timeout(15000),
    headers: { Accept: 'application/json' },
  }).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json || !json.ok) throw new Error(json?.error || 'Reader thất bại');
    return json;
  });
}

export async function fetchArticle(targetUrl) {
  const url = normalizeUrl(targetUrl);
  const candidates = [];
  if (isWeb && typeof window !== 'undefined' && window.location) {
    const sameOrigin = `${window.location.origin}/api/article?url=${encodeURIComponent(url)}`;
    candidates.push(sameOrigin);
  }
  candidates.push(`${BACKEND_URL}/api/article?url=${encodeURIComponent(url)}`);

  let lastError = null;
  for (const candidate of [...new Set(candidates)]) {
    try {
      return await tryFetch(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Không đọc được bài viết');
}