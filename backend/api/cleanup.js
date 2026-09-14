import { deleteSpamNews } from '../src/services/supabase.js';
import { checkCronSecret } from '../src/utils/auth.js';

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-cron-secret');

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'GET' && request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'Method phải là GET hoặc POST' });
  }

  const denied = checkCronSecret(request, response);
  if (denied) return denied;

  const rawLimit = Number(request.query.limit || 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(2000, Math.max(1, Math.floor(rawLimit))) : 500;

  const startedAt = new Date().toISOString();
  try {
    const result = await deleteSpamNews({ limit, force: true });
    return response.status(200).json({
      ok: true,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      checked: result.checked || 0,
      deleted: result.deleted || 0,
      message: `Đã rà ${result.checked} tin, xóa ${result.deleted} tin rác/trùng.`,
    });
  } catch (error) {
    console.error('[cleanup]', error);
    return response.status(500).json({
      ok: false,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      error: error.message,
    });
  }
}