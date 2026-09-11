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
let memory = null;
let active = 0;

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
  if (memory) return;
  try {
    const raw = await storageGet(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const entries = Array.isArray(parsed) ? parsed : parsed?.items || [];
    const fresh = new Map();
    for (const [en, vi, at] of entries) {
      if (en && vi && en !== vi && Date.now() - (at || 0) < TTL_MS) fresh.set(en, vi);
    }
    memory = fresh;
  } catch {
    memory = new Map();
  }
}

function persist() {
  if (!memory) return;
  const items = Array.from(memory.entries())
    .slice(-MAX_CACHE)
    .map(([en, vi]) => [en, vi, Date.now()]);
  storageSet(CACHE_KEY, JSON.stringify(items));
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
  if (memory.has(trimmed)) return memory.get(trimmed);
  if (inflight.has(trimmed)) return inflight.get(trimmed);

  const promise = new Promise((resolve, reject) => {
    if (queue.length >= MAX_QUEUE) {
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
        memory.set(trimmed, vi);
        persist();
      }
    })
    .catch(() => {})
    .finally(() => {
      inflight.delete(trimmed);
    });

  return promise.then((vi) => vi || trimmed);
}