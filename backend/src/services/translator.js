const GTX_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';
const GCLOUD_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

function hasGoogleCloudKey() {
  return Boolean(process.env.TRANSLATE_API_KEY);
}

async function translateGoogleCloud(text) {
  const response = await fetch(
    `${GCLOUD_ENDPOINT}?key=${process.env.TRANSLATE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'en', target: 'vi', format: 'text' }),
      signal: AbortSignal.timeout(4500),
    }
  );
  if (!response.ok) {
    throw new Error(`Google Cloud Translation responded with ${response.status}`);
  }
  const json = await response.json();
  return json?.data?.translations?.[0]?.translatedText || '';
}

async function translateMymemory(text) {
  const params = new URLSearchParams({ q: text, langpair: 'en|vi' });
  const response = await fetch(`${MYMEMORY_ENDPOINT}?${params.toString()}`, {
    signal: AbortSignal.timeout(4500),
    headers: { 'User-Agent': 'ASTER-NewsBot/1.0' },
  });
  if (!response.ok) {
    throw new Error(`MyMemory responded with ${response.status}`);
  }
  const json = await response.json();
  if (json?.responseStatus !== 200) {
    throw new Error(`MyMemory status ${json?.responseStatus}`);
  }
  return json?.responseData?.translatedText?.trim() || '';
}

async function translateGtx(text) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: 'vi',
    dt: 't',
    dj: '1',
    q: text,
  });
  const response = await fetch(`${GTX_ENDPOINT}?${params.toString()}`, {
    signal: AbortSignal.timeout(4500),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });
  if (!response.ok) {
    throw new Error(`Google Translate responded with ${response.status}`);
  }
  const json = await response.json();
  return (json?.sentences || []).map((s) => s?.trans).join(' ').trim();
}

export async function translateToVietnamese(text) {
  const q = String(text || '').trim();
  if (!q) return '';

  const providers = hasGoogleCloudKey()
    ? [translateGoogleCloud]
    : [translateMymemory, translateGtx];

  let lastError = null;
  for (const provider of providers) {
    try {
      const translated = await provider(q);
      const cleaned = String(translated || '').replace(/\s+/g, ' ').trim();
      if (cleaned) return cleaned;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No translation provider succeeded');
}

export async function translateTitles(items, { limit = 20, concurrency = 10 } = {}) {
  const targets = items
    .filter((item) => item && item.title && !item.title_vi)
    .slice(0, limit);

  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const item = targets[cursor++];
      try {
        item.title_vi = await translateToVietnamese(item.title);
      } catch (error) {
        console.warn(`[translator] failed for "${item.title.slice(0, 60)}": ${error.message}`);
        item.title_vi = '';
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, targets.length) },
    () => worker()
  );
  await Promise.all(workers);

  return targets;
}