import { lookup } from 'node:dns/promises';

// Chặn SSRF: chỉ cho phép http(s) public, không fetch IP riêng tư / loopback /
// link-local / metadata cloud (169.254.169.254) / CGNAT. Kiểm tra cả DNS (rebinding).

const PRIVATE_IPV4 = [
  [/^0\./, 'current network'],
  [/^10\./, 'private 10/8'],
  [/^127\./, 'loopback'],
  [/^169\.254\./, 'link-local / cloud metadata'],
  [/^172\.(1[6-9]|2\d|3[01])\./, 'private 172.16/12'],
  [/^192\.168\./, 'private 192.168/16'],
  [/^100\.(6[4-9]|[7-9]\d)\./, 'CGNAT 100.64/10'],
  [/^198\.(18|19)\./, 'benchmarking'],
  [/^224\./, 'multicast'],
  [/^(22[4-9]|23[0-9])\./, 'multicast'],
  [/^2[4-7]\d\./, 'reserved'],
  [/^255\.255\.255\.255$/, 'broadcast'],
];

function isPrivateIpv4(ip) {
  return PRIVATE_IPV4.some(([re]) => re.test(ip));
}

function isPrivateIpv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
  if (/^fe[89ab]/.test(lower)) return true; // fe80::/10
  const v4Mapped = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4Mapped) return isPrivateIpv4(v4Mapped[1]);
  return false;
}

function looksIpLiteral(host) {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return host.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255);
  }
  return host.includes(':');
}

async function resolvePublic(host) {
  const clean = host.replace(/^\[|\]$/g, '');
  if (looksIpLiteral(clean)) {
    if (isPrivateIpv4(clean) || isPrivateIpv6(clean)) {
      throw new Error(`Địa chỉ IP riêng tư không được phép: ${host}`);
    }
    return;
  }
  let addresses;
  try {
    addresses = await lookup(clean, { all: true, verbatim: true });
  } catch {
    throw new Error(`Không phân giải được host: ${host}`);
  }
  for (const { address } of addresses) {
    if (isPrivateIpv4(address) || isPrivateIpv6(address)) {
      throw new Error(`Host ${host} trỏ tới địa chỉ riêng tư (${address})`);
    }
  }
}

export async function assertPublicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('URL không hợp lệ');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Chỉ hỗ trợ http/https');
  }
  if (url.username || url.password) {
    throw new Error('URL không được chứa thông tin đăng nhập');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new Error('Cổng không hợp lệ');
  }
  await resolvePublic(url.hostname);
}

// Giống fetch nhưng:
// - block SSRF ở từng bước redirect (theo dõi redirect thủ công để kiểm tra mỗi hop).
export async function safeFetch(url, options = {}) {
  const maxRedirects = options.maxRedirects ?? 3;
  const timeoutMs = options.timeoutMs ?? 9000;
  let current = url;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await assertPublicUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(current, {
        method: options.method ?? 'GET',
        headers: options.headers,
        body: options.body,
        redirect: 'manual',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Chuyển hướng không có Location');
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error('Quá nhiều bước chuyển hướng');
}