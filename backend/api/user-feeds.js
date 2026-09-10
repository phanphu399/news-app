import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const client = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function normalizeUrl(url) {
  const value = String(url || '').trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

async function validateFeed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(url, {
    signal: controller.signal,
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`Feed trả về HTTP ${res.status}`);
  const text = await res.text();
  const trimmed = String(text || '').slice(0, 4000).toLowerCase();
  if (!trimmed.includes('<rss') && !trimmed.includes('<feed') && !trimmed.includes('<rdf')) {
    throw new Error('URL không phải một RSS/Atom feed hợp lệ');
  }
  return true;
}

export default async function handler(request, response) {
  cors(response);
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (!client) {
    return response.status(500).json({ ok: false, error: 'Backend chưa cấu hình Supabase' });
  }

  try {
    if (request.method === 'GET') {
      const { data, error } = await client
        .from('user_feeds')
        .select('id,name,rss_url,category,enabled,last_error,last_fetched_at,created_at')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return response.status(200).json({ ok: true, feeds: data ?? [] });
    }

    if (request.method === 'POST') {
      const { name, rssUrl, category } = request.body || {};
      if (!name || !String(name).trim()) {
        return response.status(400).json({ ok: false, error: 'Thiếu tên nguồn tin' });
      }
      const url = normalizeUrl(rssUrl);
      if (!/^https?:\/\//i.test(url)) {
        return response.status(400).json({ ok: false, error: 'Link RSS không hợp lệ' });
      }

      await validateFeed(url);

      const { data, error } = await client
        .from('user_feeds')
        .upsert(
          {
            name: String(name).trim(),
            rss_url: url,
            category: category || 'Custom',
            enabled: true,
          },
          { onConflict: 'rss_url' }
        )
        .select('id,name,rss_url,category')
        .single();
      if (error) throw new Error(error.message);

      return response.status(200).json({ ok: true, feed: data });
    }

    if (request.method === 'DELETE') {
      const id = request.query.id || '';
      const { error } = await client.from('user_feeds').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return response.status(200).json({ ok: true });
    }

    return response.status(405).json({ ok: false, error: 'Method không được hỗ trợ' });
  } catch (error) {
    return response.status(400).json({ ok: false, error: error.message });
  }
}