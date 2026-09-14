import { scrapeAll, fetchFeed } from '../src/services/scraper.js';
import {
  upsertNews,
  cleanupOldNews,
  deleteSpamNews,
  reclassifyPaywallToMacro,
  listUserFeeds,
  updateUserFeedStatus,
  cronAcquireLock,
} from '../src/services/supabase.js';
import { notifyImportantNews } from '../src/services/fcm.js';
import { generateRunId } from '../src/utils/helpers.js';
import { isJunkItem, buildTitleSelection } from '../src/utils/spamFilter.js';
import { checkCronSecret } from '../src/utils/auth.js';

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

const TIER_CONFIG = {
  hot: { lockSeconds: 60, lockId: 11, label: 'hot' },
  standard: { lockSeconds: 60 * 5, lockId: 12, label: 'standard' },
  full: { lockSeconds: 60 * 60 * 4, lockId: 13, label: 'full' },
};

export default async function handler(request, response) {
  const runId = generateRunId();
  const startAt = new Date().toISOString();
  const tier = TIER_CONFIG[request.query.tier] ? request.query.tier : 'hot';
  const tierCfg = TIER_CONFIG[tier];
  const payload = {
    run_id: runId,
    status: 'ok',
    tier,
    started_at: startAt,
    scraped: 0,
    user_feeds: 0,
    spam_filtered: 0,
    duplicate_filtered: 0,
    upserted: 0,
    notified: 0,
    cleaned: 0,
    junk_deleted: 0,
    reclassified: 0,
    message: '',
  };

  const denied = checkCronSecret(request, response);
  if (denied) return denied;

  try {
    const acquired = await cronAcquireLock(tierCfg.lockSeconds, tierCfg.lockId);
    if (!acquired) {
      payload.status = 'skipped';
      payload.message = 'Có một lượt chạy cùng tier đang diễn ra (lock).';
      return response.status(200).json(payload);
    }

    const systemItems = await scrapeAll({ tier });
    payload.scraped = systemItems.length;
    const userItems = await fetchUserFeedItems();
    payload.user_feeds = userItems.length;
    const merged = [...systemItems, ...userItems];

    const clean = merged.filter((item) => !isJunkItem(item));
    payload.spam_filtered = merged.length - clean.length;
    const { kept: ready, dropped: duped } = buildTitleSelection(clean);
    payload.duplicate_filtered = duped.length;

    const { inserted, data: insertedRows } = await withRetry(
      () => upsertNews(ready),
      'upsertNews'
    );
    payload.upserted = inserted ?? 0;

    const insertedIds = new Set((insertedRows ?? []).map((row) => row.id));
    const brandNewImportant = ready.filter(
      (item) => item.is_important && insertedIds.has(item.id)
    );

    const notified = await notifyImportantNews(brandNewImportant);
    payload.notified = notified.length;

    if (tier === 'full') {
      const junk = await deleteSpamNews({ force: false });
      payload.junk_deleted = junk.deleted ?? 0;

      const { deleted } = await cleanupOldNews();
      payload.cleaned = deleted;

      const reclassified = await reclassifyPaywallToMacro();
      payload.reclassified = reclassified;
    }

    payload.finished_at = new Date().toISOString();
    payload.message = `tier=${tier} scraped=${payload.scraped} upserted=${payload.upserted} filtered=${payload.spam_filtered}+${payload.duplicate_filtered}`;
  } catch (error) {
    payload.status = 'error';
    payload.message = error.message;
    console.error(`[cron-fetch:${runId}]`, error);
    return response.status(500).json(payload);
  }

  return response.status(200).json(payload);
}