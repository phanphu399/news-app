import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const GTX_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const CACHE_KEY = '@aster/translations';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHE = 500;
const MAX_INFLIGHT = 4;
const MAX_QUEUE = 200;

const isWeb = Platform.OS === 'web';
const inflight = new Map();
const queue = [];

// cache: Map(en -> { vi, at }) — at = thời điểm gốc lưu lần đầu (không được
// gán lại mỗi lần persist, nếu không TTL 30 ngày không bao giờ hết hạn).
const cache = new Map();
let loaded = false;
let active = 0;
let persistTimer = null;

function looksTranslatable(text) {
  const t = text.trim();
  if (!t || t.length < 3 || t.length > 500) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  return true;
}

async function storageGet(key) {
  try {
    return isWeb ? window.localStorage.getItem(key) : await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageSet(key, value) {
  try {
    if (isWeb) window.localStorage.setItem(key, value);
    else await AsyncStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

async function loadCache() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await storageGet(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const entries = Array.isArray(parsed) ? parsed : parsed?.items || [];
    const now = Date.now();
    for (const [en, vi, at] of entries) {
      if (!en || !vi || en === vi) continue;
      const savedAt = Number(at) || now;
      if (now - savedAt >= TTL_MS) continue;
      cache.set(en, { vi, at: savedAt });
    }
  } catch {
    /* cache hư → bắt đầu trống */
  }
}

// Xóa entry hết hạn + quá dung lượng (giữ 500 entry mới nhất theo at).
function prune() {
  const now = Date.now();
  for (const [en, entry] of cache) {
    if (now - entry.at >= TTL_MS) cache.delete(en);
  }
  if (cache.size > MAX_CACHE) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].at - b[1].at)
      .slice(0, cache.size - MAX_CACHE);
    for (const [en] of oldest) cache.delete(en);
  }
}

// Ghi toàn bộ cache nhưng GIỮ NGUYÊN at gốc; gộp nhiều bản dịch liên tiếp
// thành 1 lần ghi (debounce) để tránh rewrite file mỗi lần dịch.
function persist() {
  prune();
  const items = Array.from(cache.entries()).map(([en, entry]) => [en, entry.vi, entry.at]);
  storageSet(CACHE_KEY, JSON.stringify(items));
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persist();
  }, 1500);
}

function buildUrl(text) {
  return `${GTX_ENDPOINT}?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
}

async function fetchTranslation(text) {
  const res = await fetch(buildUrl(text));
  if (!res.ok) throw new Error(`translate ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || !Array.isArray(json[0])) throw new Error('translate bad payload');
  return json[0]
    .map((seg) => seg && seg[0])
    .filter(Boolean)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function runQueue() {
  while (active < MAX_INFLIGHT && queue.length > 0) {
    const { text, resolve, reject } = queue.shift();
    active += 1;
    fetchTranslation(text)
      .then(resolve, reject)
      .finally(() => {
        active -= 1;
        runQueue();
      });
  }
}

export async function translateToVietnamese(text) {
  const trimmed = String(text || '').trim();
  if (!looksTranslatable(trimmed)) return trimmed;

  await loadCache();
  const hit = cache.get(trimmed);
  if (hit) return hit.vi;
  if (inflight.has(trimmed)) return inflight.get(trimmed);

  const promise = new Promise((resolve, reject) => {
    if (queue.length >= MAX_QUEUE) {
      // Queue đầy: KHÔNG cache bản gốc — trả null để gọi chỗ khác tự fallback.
      resolve(null);
      return;
    }
    queue.push({ text: trimmed, resolve, reject });
    runQueue();
  });
  inflight.set(trimmed, promise);

  promise
    .then((vi) => {
      if (vi && vi !== trimmed) {
        cache.set(trimmed, { vi, at: Date.now() });
        schedulePersist();
      }
    })
    .catch(() => {})
    .finally(() => {
      inflight.delete(trimmed);
    });

  return promise.then((vi) => vi || trimmed);
}