import { safeFetch } from '../src/utils/safeFetch.js';

const REMOVE_RE =
  /<(script|style|noscript|svg|iframe|form|nav|aside|footer|header|button|input|select|textarea|template|figure)[^>]*>[\s\S]*?<\/\1>/gi;
const P_RE = /<p[^>]*>([\s\S]*?)<\/p>/gi;
const TAG_RE = /<[^>]+>/g;

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name] || match);
}

function cleanText(raw) {
  return decodeEntities(raw.replace(TAG_RE, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html, ogProp) {
  const match = html.match(
    new RegExp(`<meta[^>]+property=["']og:${ogProp}["'][^>]+content=["']([^"']*)["']`, 'i')
  ) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${ogProp}["']`, 'i'));
  return match ? cleanText(match[1]) : '';
}

function parseHtml(html) {
  const cleaned = html.replace(REMOVE_RE, ' ');
  const title =
    extractMeta(cleaned, 'title') ||
    cleanText((cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const description =
    extractMeta(cleaned, 'description') ||
    cleanText((cleaned.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || '');
  const image = extractMeta(cleaned, 'image');
  const siteName =
    extractMeta(cleaned, 'site_name') ||
    (cleaned.match(/<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']*)["']/i) || [])[1] ||
    '';

  const paragraphs = [];
  let match;
  while ((match = P_RE.exec(cleaned)) !== null) {
    const text = cleanText(match[1]);
    if (!text) continue;
    if (text.length > 22) paragraphs.push(text);
    if (paragraphs.length >= 120) break;
  }

  return { title, description, image, siteName, paragraphs };
}

function errorResponse(response, message) {
  return response.status(200).json({ ok: false, error: message });
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (request.method === 'OPTIONS') return response.status(204).end();

  const rawUrl = request.query.url || '';
  const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
  if (!/^https?:\/\//i.test(url)) {
    return errorResponse(response, 'Thiếu tham số url hợp lệ');
  }

  const host = safeHost(url);
  if (host === 'news.google.com') {
    return errorResponse(response, 'GOOGLE_NEWS');
  }

  try {
    const res = await safeFetch(url, {
      timeoutMs: 9000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) {
      return errorResponse(response, `Trang trả về HTTP ${res.status}`);
    }

    const htmlText = (await res.text?.()) ?? '';
    const html = String(htmlText || '').slice(0, 900000);
    if (!html) return errorResponse(response, 'Không đọc được nội dung trang');

    const parsed = parseHtml(html);
    response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600');
    return response.status(200).json({
      ok: true,
      url,
      fetchedAt: new Date().toISOString(),
      source: cleanText(parsed.siteName) || safeHost(url),
      title: parsed.title,
      description: parsed.description,
      image: parsed.image || '',
      paragraphs: parsed.paragraphs,
    });
  } catch (error) {
    return errorResponse(response, `Không kết nối được trang: ${error.message}`);
  }
}

function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}