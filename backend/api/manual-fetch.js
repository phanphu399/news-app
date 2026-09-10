import { scrapeAll, fetchFeed } from '../src/services/scraper.js';
import {
  upsertNews,
  listUserFeeds,
  updateUserFeedStatus,
  cleanupOldNews,
  deleteSpamNews,
  reclassifyPaywallToMacro,
} from '../src/services/supabase.js';
import { isJunkItem, buildTitleSelection } from '../src/utils/spamFilter.js';

const MIN_INTERVAL_MS = 60 * 1000;
let lastRunAt = 0;

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(request, response) {
  cors(response);
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'Method phải là POST' });
  }

  const now = Date.now();
  if (now - lastRunAt < MIN_INTERVAL_MS) {
    const remaining = Math.ceil((MIN_INTERVAL_MS - (now - lastRunAt)) / 1000);
    return response.status(429).json({
      ok: false,
      error: `Vui lòng đợi ${remaining}s giữa hai lần cào thủ công.`,
    });
  }
  lastRunAt = now;

  const payload = {
    ok: true,
    scraped: 0,
    user_feeds: 0,
    spam_filtered: 0,
    duplicate_filtered: 0,
    upserted: 0,
    junk_deleted: 0,
    message: '',
  };

  try {
    const systemItems = await scrapeAll();
    payload.scraped = systemItems.length;

    const userFeeds = await listUserFeeds();
    const userItems = [];
    const handleFeed = async (feed) => {
      try {
        const got = await fetchFeed({
          url: feed.rss_url,
          source: feed.name || feed.rss_url,
          category: feed.category || 'Custom',
        });
        const valid = (got || []).filter((item) => item.title && item.title.trim());
        await updateUserFeedStatus(feed.id, {
          ok: valid.length > 0,
          error: valid.length ? '' : 'Feed tải được nhưng không có bài phân tích được',
        });
        return valid;
      } catch (error) {
        await updateUserFeedStatus(feed.id, { ok: false, error: String(error.message || error).slice(0, 240) });
        return [];
      }
    };
    const results = await Promise.all(userFeeds.map(handleFeed));
    for (const list of results) userItems.push(...list);
    payload.user_feeds = userItems.length;

    const merged = [...systemItems, ...userItems];
    const clean = merged.filter((item) => !isJunkItem(item));
    payload.spam_filtered = merged.length - clean.length;
    const { kept: items, dropped: duped } = buildTitleSelection(clean);
    payload.duplicate_filtered = duped.length;

    const { inserted } = await upsertNews(items);
    payload.upserted = inserted ?? 0;

    const junk = await deleteSpamNews({ force: true });
    payload.junk_deleted = junk.deleted ?? 0;

    await cleanupOldNews({ force: true });
    await reclassifyPaywallToMacro();

    payload.message =
      payload.upserted > 0
        ? `Đã cập nhật ${payload.upserted} tin mới (chặn ${payload.spam_filtered} rác + ${payload.duplicate_filtered} trùng, xóa ${payload.junk_deleted} rác tồn đọng).`
        : `Không có tin mới (chặn ${payload.spam_filtered} rác + ${payload.duplicate_filtered} trùng, xóa ${payload.junk_deleted} rác tồn đọng).`;
  } catch (error) {
    console.error('[manual-fetch]', error);
    payload.ok = false;
    payload.error = error.message;
    return response.status(500).json(payload);
  }

  return response.status(200).json(payload);
}