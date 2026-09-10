import { cleanupOldNews } from '../src/services/supabase.js';

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return response.status(204).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { deleted } = await cleanupOldNews({ force: true });
    return response.status(200).json({ ok: true, deleted });
  } catch (error) {
    console.error('[cleanup]', error);
    return response.status(500).json({ ok: false, error: error.message });
  }
}