import { timingSafeEqual } from 'node:crypto';

// So sánh secret constant-time (tránh timing attack).
function safeEqual(a, b) {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function extractSecret(request) {
  const auth = request.headers.authorization || '';
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const header = request.headers['x-cron-secret'];
  if (header && String(header).trim()) return String(header).trim();
  const query = request.query || {};
  const q = query.secret ?? query.key;
  if (q != null) return String(q).trim();
  return '';
}

// Fail-closed: nếu chưa cấu hình CRON_SECRET thì từ chối luôn (không fail-open).
// Luôn trả về truthy khi chặn — không phụ thuộc giá trị trả về của response.json().
export function checkCronSecret(request, response) {
  const configured = process.env.CRON_SECRET || '';
  if (!configured) {
    response.status(500).json({ ok: false, error: 'Backend chưa cấu hình CRON_SECRET — từ chối thực thi.' });
    return true;
  }
  const provided = extractSecret(request);
  if (!provided || !safeEqual(provided, configured)) {
    response.status(401).json({ ok: false, error: 'Thiếu hoặc sai CRON_SECRET (header x-cron-secret, Authorization Bearer hoặc ?secret=).' });
    return true;
  }
  return null;
}