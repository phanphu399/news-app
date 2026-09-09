import { scrapeAll } from '../src/services/scraper.js';
import { upsertNews, cleanupOldNews, findExistingIds } from '../src/services/supabase.js';
import { notifyImportantNews } from '../src/services/fcm.js';
import { generateRunId } from '../src/utils/helpers.js';

export default async function handler(request, response) {
  const runId = generateRunId();
  const startAt = new Date().toISOString();
  const payload = {
    run_id: runId,
    status: 'ok',
    started_at: startAt,
    scraped: 0,
    upserted: 0,
    notified: 0,
    cleaned: 0,
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
    const items = await scrapeAll();
    payload.scraped = items.length;

    const importantIds = items.filter((item) => item.is_important).map((item) => item.id);
    const existingIds = await findExistingIds(importantIds);
    const brandNewImportant = items.filter(
      (item) => item.is_important && !existingIds.has(item.id)
    );

    const { data: insertedRows } = await upsertNews(items);
    const insertedRowsArray = Array.isArray(insertedRows) ? insertedRows : [];
    payload.upserted = insertedRowsArray.length;

    const notified = await notifyImportantNews(brandNewImportant);
    payload.notified = notified.length;

    const { deleted } = await cleanupOldNews();
    payload.cleaned = deleted;

    payload.finished_at = new Date().toISOString();
  } catch (error) {
    payload.status = 'error';
    payload.message = error.message;
    console.error(`[cron-fetch:${runId}]`, error);
    return response.status(500).json(payload);
  }

  return response.status(200).json(payload);
}