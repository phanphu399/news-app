import { createClient } from '@supabase/supabase-js';
import { DATA_RETENTION_DAYS } from '../config/constants.js';

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
    if (item.title_vi) {
      row.title_vi = item.title_vi;
    }
    return row;
  });

  const { data, error } = await client.from('market_news').upsert(payload, {
    onConflict: 'id',
  }).select('id');

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  return { inserted: data?.length ?? 0, data: data ?? [] };
}

export async function findExistingIds(ids) {
  if (!isReady() || ids.length === 0) {
    return new Set();
  }

  const { data, error } = await client
    .from('market_news')
    .select('id')
    .in('id', [...new Set(ids)].slice(0, 1000));

  if (error) {
    throw new Error(`Supabase select failed: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.id));
}

export async function fetchUntranslatedRows(limit) {
  if (!isReady() || !limit || limit <= 0) {
    return [];
  }

  const { data, error } = await client
    .from('market_news')
    .select('id, title')
    .is('title_vi', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase untranslated select failed: ${error.message}`);
  }

  return data ?? [];
}

export async function updateVietnameseTitles(rows) {
  if (!isReady() || rows.length === 0) {
    return 0;
  }

  let updated = 0;
  for (const row of rows) {
    if (!row.title_vi) continue;
    const { error } = await client
      .from('market_news')
      .update({ title_vi: row.title_vi })
      .eq('id', row.id);
    if (error) {
      throw new Error(`Supabase title_vi update failed: ${error.message}`);
    }
    updated += 1;
  }

  return updated;
}

export async function cleanupOldNews() {
  if (!isReady()) return { deleted: 0 };

  const cutoff = new Date(Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('market_news')
    .delete()
    .lt('published_at', cutoff)
    .select('id');

  if (error) {
    throw new Error(`Supabase cleanup failed: ${error.message}`);
  }

  return { deleted: data?.length ?? 0 };
}

export async function reclassifyPaywallToMacro(limit = 100) {
  if (!isReady()) return 0;

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