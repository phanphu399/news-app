import { scrapeAll, fetchFeed } from '../src/services/scraper.js';
import {
  upsertNews,
  cleanupOldNews,
  reclassifyPaywallToMacro,
  listUserFeeds,
  updateUserFeedStatus,
  cronAcquireLock,
} from '../src/services/supabase.js';
import { notifyImportantNews } from '../src/services/fcm.js';
import { generateRunId } from '../src/utils/helpers.js';

async function withRetry(run, label, attempts = 2) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (attempt === attempts) throw error;
      console.warn(`[cron-fetch] ${label} failed (attempt ${attempt}), retrying...`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  return null;
}

async function fetchUserFeedItems() {
  const feeds = await listUserFeeds();
  const items = [];

  const handleFeed = async (feed) => {
    try {
      const got = await fetchFeed({
        url: feed.rss_url,
        source: feed.name || feed.rss_url,
        category: feed.category || 'Custom',
      });
      const valid = (got || []).filter((item) => item.title && item.title.trim());
      if (valid.length === 0) {
        return { feed, items: [], error: 'Feed tải được nhưng không có bài phân tích được (có thể không phải RSS/Atom hợp lệ)' };
      }
      return { feed, items: valid, error: null };
    } catch (error) {
      return { feed, items: [], error: String(error.message || error).slice(0, 240) };
    }
  };

  const CONCURRENCY = 4;
  let index = 0;
  const worker = async () => {
    while (index < feeds.length) {
      const current = feeds[index];
      index += 1;
      const result = await handleFeed(current);
      items.push(...result.items);
      await updateUserFeedStatus(current.id, result.error ? { ok: false, error: result.error } : { ok: true });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(feeds.length, 1)) }, () => worker())
  );

  return items;
}

export default async function handler(request, response) {
  const runId = generateRunId();
  const startAt = new Date().toISOString();
  const payload = {
    run_id: runId,
    status: 'ok',
    started_at: startAt,
    scraped: 0,
    user_feeds: 0,
    upserted: 0,
    notified: 0,
    cleaned: 0,
    reclassified: 0,
    message: '',
  };

  const authHeader = request.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET || '';
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return response.status(401).json({
      run_id: runId,
      status: 'unauthorized',
      started_at: startAt,
    });
  }

  try {
    const acquired = await cronAcquireLock(60);
    if (!acquired) {
      payload.status = 'skipped';
      payload.message = 'Có một lượt chạy khác đang diễn ra (lock).';
      return response.status(200).json(payload);
    }

    const systemItems = await scrapeAll();
    payload.scraped = systemItems.length;
    const userItems = await fetchUserFeedItems();
    payload.user_feeds = userItems.length;
    const items = [...systemItems, ...userItems];

    const { inserted, data: insertedRows } = await withRetry(
      () => upsertNews(items),
      'upsertNews'
    );
    payload.upserted = inserted ?? 0;

    const insertedIds = new Set((insertedRows ?? []).map((row) => row.id));
    const brandNewImportant = items.filter(
      (item) => item.is_important && insertedIds.has(item.id)
    );

    const notified = await notifyImportantNews(brandNewImportant);
    payload.notified = notified.length;

    const { deleted } = await cleanupOldNews();
    payload.cleaned = deleted;

    const reclassified = await reclassifyPaywallToMacro();
    payload.reclassified = reclassified;

    payload.finished_at = new Date().toISOString();
  } catch (error) {
    payload.status = 'error';
    payload.message = error.message;
    console.error(`[cron-fetch:${runId}]`, error);
    return response.status(500).json(payload);
  }

  return response.status(200).json(payload);
}