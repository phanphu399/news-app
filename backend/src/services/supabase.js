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

  const payload = items.map((item) => ({
    id: item.id,
    title: item.title,
    source: item.source,
    url: item.url,
    category: item.category,
    is_important: Boolean(item.is_important),
    published_at: item.published_at,
  }));

  const { data, error } = await client.from('market_news').upsert(payload, {
    onConflict: 'id',
  });

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