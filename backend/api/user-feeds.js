import { createClient } from '@supabase/supabase-js';
import { fetchFeed } from '../src/services/scraper.js';
import { safeFetch } from '../src/utils/safeFetch.js';
import { checkWritableSecret } from '../src/utils/auth.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const client = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function normalizeUrl(url) {
  const value = String(url || '').trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

async function validateFeed(url) {
  const res = await safeFetch(
    url,
    {
      timeoutMs: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    }
  );
  if (!res.ok) throw new Error(`Feed trả về HTTP ${res.status}`);
  const text = await res.text();
  const trimmed = String(text || '').slice(0, 4000).toLowerCase();
  if (!trimmed.includes('<rss') && !trimmed.includes('<feed') && !trimmed.includes('<rdf')) {
    throw new Error('URL không phải một RSS/Atom feed hợp lệ');
  }
  return true;
}

async function previewFeed(url) {
  const items = await fetchFeed({ url, source: 'Feed preview', category: 'Custom' });
  return (items || [])
    .filter((item) => item.title && item.url)
    .slice(0, 6)
    .map((item) => ({
      title: item.title,
      url: item.url,
      publishedAt: item.published_at ? new Date(item.published_at).toISOString() : null,
    }));
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

    if (request.method === 'POST' && request.query.action === 'test') {
      const { rssUrl } = request.body || {};
      const url = normalizeUrl(rssUrl);
      if (!/^https?:\/\//i.test(url)) {
        return response.status(400).json({ ok: false, error: 'Link RSS không hợp lệ' });
      }
      await validateFeed(url);
      const preview = await previewFeed(url);
      if (!preview.length) {
        return response.status(200).json({
          ok: true,
          valid: false,
          message: 'Feed hợp lệ nhưng chưa cào được bài nào (có thể nguồn quá cũ hoặc bị chặn).',
          items: [],
        });
      }
      return response.status(200).json({
        ok: true,
        valid: true,
        message: `Cào thử thành công — tìm thấy ${preview.length} bài mẫu.`,
        items: preview,
      });
    }

    if (request.method === 'POST') {
      const denied = checkWritableSecret(request, response);
      if (denied) return denied;
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

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const denied = checkWritableSecret(request, response);
      if (denied) return denied;
      const id = request.query.id || (request.body && request.body.id) || '';
      if (!id) {
        return response.status(400).json({ ok: false, error: 'Thiếu mã nguồn tin' });
      }
      const body = request.body || {};
      const patch = {};
      if (body.name != null && String(body.name).trim()) patch.name = String(body.name).trim();
      if (body.category != null && String(body.category).trim()) {
        patch.category = String(body.category).trim();
      }
      if (body.enabled != null && typeof body.enabled === 'boolean') patch.enabled = body.enabled;
      if (body.rssUrl != null && String(body.rssUrl).trim()) {
        const url = normalizeUrl(body.rssUrl);
        if (!/^https?:\/\//i.test(url)) {
          return response.status(400).json({ ok: false, error: 'Link RSS không hợp lệ' });
        }
        await validateFeed(url);
        patch.rss_url = url;
      }
      if (!Object.keys(patch).length) {
        return response.status(400).json({ ok: false, error: 'Không có thông tin cần cập nhật' });
      }
      const { data, error } = await client
        .from('user_feeds')
        .update(patch)
        .eq('id', id)
        .select('id,name,rss_url,category,enabled')
        .single();
      if (error) throw new Error(error.message);
      return response.status(200).json({ ok: true, feed: data });
    }

    if (request.method === 'DELETE') {
      const denied = checkWritableSecret(request, response);
      if (denied) return denied;
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