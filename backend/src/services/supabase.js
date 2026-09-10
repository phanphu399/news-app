import { createClient } from '@supabase/supabase-js';
import { isJunkTitle, titleKey } from '../utils/spamFilter.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. DB actions are disabled.');
}

const client = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function isReady() {
  return Boolean(client);
}

export async function upsertNews(items) {
  if (!isReady() || items.length === 0) {
    return { inserted: 0, data: [] };
  }

  const payload = items.map((item) => {
    const row = {
      id: item.id,
      title: item.title,
      source: item.source,
      url: item.url,
      category: item.category,
      is_important: Boolean(item.is_important),
      published_at: item.published_at,
    };
    return row;
  });

  const { data, error } = await client
    .from('market_news')
    .upsert(payload, {
      onConflict: 'id',
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  return { inserted: data?.length ?? 0, data: data ?? [] };
}

let lastCleanupAt = 0;
const CLEANUP_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

const RETENTION_MAX_ROWS = 100;

export async function cleanupOldNews({ force = false } = {}) {
  if (!isReady()) return { deleted: 0 };

  const now = Date.now();
  if (!force && now - lastCleanupAt < CLEANUP_MIN_INTERVAL_MS) {
    return { deleted: 0, skipped: true };
  }
  if (!force) lastCleanupAt = now;

  const { data: keepRows, error } = await client
    .from('market_news')
    .select('id,published_at')
    .order('published_at', { ascending: false })
    .limit(RETENTION_MAX_ROWS);

  if (error) {
    throw new Error(`Supabase cleanup failed: ${error.message}`);
  }

  if (Array.isArray(keepRows) && keepRows.length === 0) return { deleted: 0 };
  const threshold = keepRows[keepRows.length - 1]?.published_at;
  if (!threshold) return { deleted: 0 };

  const { data: deletedRows, error: deleteError } = await client
    .from('market_news')
    .delete()
    .lt('published_at', threshold)
    .select('id');

  if (deleteError) {
    throw new Error(`Supabase cleanup delete failed: ${deleteError.message}`);
  }

  return { deleted: Array.isArray(deletedRows) ? deletedRows.length : 0 };
}

let lastJunkCleanAt = 0;
const JUNK_CLEAN_MIN_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Quét các tin đã lưu, xóa rác (spam title) và bài trùng title dư thừa.
 * Giữ lại bài "đại diện" mỗi title: ưu tiên important, nguồn thật, mới nhất.
 * Chạy từ full-tier cron (tự ghìm 1h) hoặc qua /api/cleanup (force).
 */
export async function deleteSpamNews({ limit = 500, force = false } = {}) {
  if (!isReady()) return { checked: 0, deleted: 0 };

  const now = Date.now();
  if (!force && now - lastJunkCleanAt < JUNK_CLEAN_MIN_INTERVAL_MS) {
    return { checked: 0, deleted: 0, skipped: true };
  }
  if (!force) lastJunkCleanAt = now;

  const { data: rows, error: selectError } = await client
    .from('market_news')
    .select('id,title,url,source,category,is_important,published_at')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (selectError) throw new Error(`Supabase junk scan failed: ${selectError.message}`);
  if (!Array.isArray(rows) || rows.length === 0) return { checked: 0, deleted: 0 };

  const toDelete = new Set();
  const byKey = new Map();

  for (const row of rows) {
    if (isJunkTitle(row.title)) {
      toDelete.add(row.id);
      continue;
    }
    const key = titleKey(row.title);
    if (!key) {
      toDelete.add(row.id);
      continue;
    }
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, row);
      continue;
    }
    const keepNewest =
      new Date(row.published_at || 0).getTime() >
      new Date(current.published_at || 0).getTime();
    if (keepNewest) {
      toDelete.add(current.id);
      byKey.set(key, row);
    } else {
      toDelete.add(row.id);
    }
  }

  const ids = [...toDelete];
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const { data: removed, error: delError } = await client
      .from('market_news')
      .delete()
      .in('id', batch)
      .select('id');
    if (delError) throw new Error(`Supabase junk delete failed: ${delError.message}`);
    deleted += Array.isArray(removed) ? removed.length : 0;
  }

  return { checked: rows.length, deleted };
}

export async function listUserFeeds() {
  if (!isReady()) return [];
  try {
    const { data, error } = await client
      .from('user_feeds')
      .select('id,name,rss_url,category,enabled,last_error,last_fetched_at')
      .or('enabled.is.true,enabled.is.null')
      .limit(60);
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('[supabase] listUserFeeds failed (bảng user_feeds chưa tạo?):', error.message);
    return [];
  }
}

const lastUserFeedStatusWrites = new Map();
const USER_FEED_STATUS_INTERVAL_MS = 5 * 60 * 1000;

export async function updateUserFeedStatus(id, { ok, error: errorText }) {
  if (!isReady() || !id) return;

  const now = Date.now();
  const lastWrite = lastUserFeedStatusWrites.get(id) || 0;
  const sinceLast = now - lastWrite;

  const patch = ok
    ? { last_fetched_at: new Date().toISOString(), last_error: null }
    : { last_error: String(errorText || '').slice(0, 240) };

  if (ok && sinceLast < USER_FEED_STATUS_INTERVAL_MS) {
    return;
  }
  lastUserFeedStatusWrites.set(id, now);
  await client.from('user_feeds').update(patch).eq('id', id);
}

export async function cronAcquireLock(lockSeconds = 90, lockId = 1) {
  if (!isReady()) return true;
  try {
    const cutoff = new Date(Date.now() - lockSeconds * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const seed = await client
      .from('cron_state')
      .upsert({ id: lockId, ran_at: null }, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (seed.error) return true;

    const { data, error } = await client
      .from('cron_state')
      .update({ ran_at: nowIso })
      .eq('id', lockId)
      .or(`ran_at.is.null,ran_at.lt.${cutoff}`)
      .select('id');
    if (error) return true;
    return Array.isArray(data) && data.length > 0;
  } catch {
    return true;
  }
}

let lastReclassifyAt = 0;
const RECLASSIFY_MIN_INTERVAL_MS = 10 * 60 * 1000;

export async function reclassifyPaywallToMacro(limit = 100) {
  if (!isReady()) return 0;

  const now = Date.now();
  if (now - lastReclassifyAt < RECLASSIFY_MIN_INTERVAL_MS) {
    return 0;
  }
  lastReclassifyAt = now;

  const { count } = await client
    .from('market_news')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'Paywall')
    .limit(1);
  if (!count) return 0;

  const { error } = await client
    .from('market_news')
    .update({ category: 'Macro' })
    .eq('category', 'Paywall')
    .limit(limit);

  if (error) {
    throw new Error(`Supabase reclassify failed: ${error.message}`);
  }

  return limit;
}