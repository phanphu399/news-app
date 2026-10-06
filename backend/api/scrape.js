// Cào on-demand: app gọi khi người dùng mở app hoặc bấm Làm mới.
// Không có cron — cooldown toàn cục nằm ở TIER_CONFIG['on-demand'] trong
// bảng cron_state: mọi client / mọi instance chỉ tối đa 1 lượt cào / 180s.
import { runCronFetch } from '../src/services/cronPipeline.js';

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Accept');
  // no-store: nút Làm mới phải luôn chạm origin — nếu client cache,
  // response trả về sẽ không chạy cào thật.
  response.setHeader('Cache-Control', 'no-store');
}

export default async function handler(request, response) {
  cors(response);
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'GET') {
    return response.status(405).json({ ok: false, error: 'Method must be GET' });
  }

  const payload = await runCronFetch('on-demand');
  return response.status(payload.status === 'error' ? 500 : 200).json(payload);
}
