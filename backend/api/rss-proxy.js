import { XMLParser } from 'fast-xml-parser';
import { KNOWN_SOURCES } from '../src/config/constants.js';
import { safeFetch } from '../src/utils/safeFetch.js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

function corsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const MAX_ITEMS = 15;

export default async function handler(request, response) {
  corsHeaders(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  const url = String(request.query.url || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    return response.status(400).json({ error: 'Invalid RSS url' });
  }

  try {
    const upstream = await safeFetch(url, {
      timeoutMs: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });

    if (!upstream.ok) {
      return response.status(502).json({ error: `Upstream responded with ${upstream.status}` });
    }

    const xml = await upstream.text();
    const parsed = xmlParser.parse(xml);
    const channel = parsed?.rss?.channel;

    const title = String(channel?.title || '').trim();

    if (!channel || !Array.isArray(channel.item)) {
      return response.status(200).json({ title, items: [] });
    }

    const items = channel.item
      .slice(0, MAX_ITEMS)
      .map((item) => ({
        title: String(item.title || '').trim(),
        url: item.link || item.guid?.['#text'] || item.guid || '',
        publishedAt: item.pubDate || item.published || new Date().toISOString(),
        source: KNOWN_SOURCES.GOOGLE_NEWS,
      }))
      .filter((item) => item.title && item.url);

    return response.status(200).json({ title, items });
  } catch (error) {
    console.error('[rss-proxy]', error);
    return response.status(502).json({ error: error.message });
  }
}