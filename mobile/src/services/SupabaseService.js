import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/constants';
import NewsModel from '../models/NewsModel';

let client = null;

export function getSupabase() {
  if (!client && SUPABASE_URL && SUPABASE_ANON_KEY) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return client;
}

export async function fetchLatestNews(limit = 100) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('market_news')
    .select('id,title,title_vi,source,url,category,is_important,published_at')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => NewsModel.fromSupabase(row));
}

export function subscribeRealtime(onInsert, onDelete, onUpdate) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('market-news-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'market_news' },
      (payload) => onInsert?.(NewsModel.fromSupabase(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'market_news' },
      (payload) => onUpdate?.(NewsModel.fromSupabase(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'market_news' },
      () => onDelete?.()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}