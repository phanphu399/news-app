import { createClient } from '@supabase/supabase-js';

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

export async function listUserFeeds() {
  if (!isReady()) return [];
  try {
    const { data, error } = await client
      .from('user_feeds')
      .select('id,name,rss_url,category,enabled,last_error')
      .eq('enabled', true)
      .limit(60);
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('[supabase] listUserFeeds failed (bảng user_feeds chưa tạo?):', error.message);
    return [];
  }
}

let lastUserFeedStatusWrite = 0;

export async function updateUserFeedStatus(id, { ok, error: errorText }) {
  if (!isReady() || !id) return;

  const now = Date.now();
  if (ok && now - lastUserFeedStatusWrite < 5 * 60 * 1000) {
    return;
  }
  lastUserFeedStatusWrite = now;

  const patch = ok
    ? { last_fetched_at: new Date().toISOString(), last_error: null }
    : { last_error: String(errorText || '').slice(0, 240) };
  await client.from('user_feeds').update(patch).eq('id', id);
}

export async function cronAcquireLock(lockSeconds = 90) {
  if (!isReady()) return true;
  try {
    const cutoff = new Date(Date.now() - lockSeconds * 1000).toISOString();
    const { data, error } = await client
      .from('cron_state')
      .update({ ran_at: new Date().toISOString() })
      .eq('id', 1)
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