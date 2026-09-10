import { deflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ICONS = join(DIST, 'icons');

// ---------- minimal PNG encoder (pure node, zlib) ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength).copy(
      raw,
      rowStart + 1,
      y * size * 4,
      (y + 1) * size * 4
    );
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- raster helpers ----------
function blend(px, i, r, g, b, a) {
  const srcA = a;
  const dstA = px[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  px[i] = Math.round((r * srcA + px[i] * dstA * (1 - srcA)) / outA);
  px[i + 1] = Math.round((g * srcA + px[i + 1] * dstA * (1 - srcA)) / outA);
  px[i + 2] = Math.round((b * srcA + px[i + 2] * dstA * (1 - srcA)) / outA);
  px[i + 3] = Math.round(outA * 255);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function fillCircle(px, size, cx, cy, r, rgb) {
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(size - 1, Math.ceil(cx + r + 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(size - 1, Math.ceil(cy + r + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(cx - x, cy - y);
      const alpha = Math.max(0, Math.min(1, r - d + 0.5));
      if (alpha > 0) blend(px, (y * size + x) * 4, ...rgb, alpha);
    }
  }
}

function roundedRectAlpha(x, y, size, radius) {
  const r = radius;
  const left = r;
  const right = size - r;
  const top = r;
  const bottom = size - r;
  if (x < left) {
    const dx = left - x - 0.5;
    const dy = y < top ? top - y - 0.5 : y > bottom ? y - bottom - 0.5 : 0;
    return Math.min(1, r - Math.hypot(dx, dy) + 0.5);
  }
  if (x > right) {
    const dx = x - right - 0.5;
    const dy = y < top ? top - y - 0.5 : y > bottom ? y - bottom - 0.5 : 0;
    return Math.min(1, r - Math.hypot(dx, dy) + 0.5);
  }
  if (y < top || y > bottom) return 1;
  return 1;
}

function strokePolyline(px, size, points, rgb, widthPx, alpha = 1) {
  const r = widthPx / 2;
  for (let s = 0; s < points.length - 1; s++) {
    const [x1, y1] = points[s];
    const [x2, y2] = points[s + 1];
    const x0 = Math.max(0, Math.floor(Math.min(x1, x2) - r - 1));
    const x1x = Math.min(size - 1, Math.ceil(Math.max(x1, x2) + r + 1));
    const y0 = Math.max(0, Math.floor(Math.min(y1, y2) - r - 1));
    const y1y = Math.min(size - 1, Math.ceil(Math.max(y1, y2) + r + 1));
    for (let y = y0; y <= y1y; y++) {
      for (let x = x0; x <= x1x; x++) {
        const d = distToSegment(x + 0.5, y + 0.5, x1, y1, x2, y2);
        const a = Math.max(0, Math.min(1, r - d + 0.5)) * alpha;
        if (a > 0) blend(px, (y * size + x) * 4, ...rgb, a);
      }
    }
  }
}

// ---------- icon design ----------
const GLYPH_A = ['01110', '11111', '10001', '10001', '10001', '10001', '10001'];

const GLYPH_WORD = [
  ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], // N
  ['01111', '10000', '10000', '11110', '10000', '10000', '11111'], // E
  ['10001', '10001', '10001', '10101', '10101', '11011', '10001'], // W
  ['01111', '10000', '10000', '01111', '00001', '00001', '11110'], // S
];

function cellAlpha(x, y, cell, radius) {
  const left = radius;
  const right = cell - radius;
  const top = radius;
  const bottom = cell - radius;
  if (x >= left && x <= right && y >= top && y <= bottom) return 1;
  const cx = x < left ? left : x > right ? right : x;
  const cy = y < top ? top : y > bottom ? bottom : y;
  return Math.min(1, radius - Math.hypot(x - cx, y - cy) + 0.5);
}

function drawGlyph(px, size, glyph, { sx, sy, cell, color, glowColor, glow }) {
  const rows = glyph.length;
  const cols = glyph[0].length;

  if (glow) {
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        if (glyph[gy][gx] !== '1') continue;
        const cx = sx + gx * cell + cell / 2;
        const cy = sy + gy * cell + cell / 2;
        fillCircle(px, size, cx, cy, cell * 1.05, glowColor, 0.35);
      }
    }
  }

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      if (glyph[gy][gx] !== '1') continue;
      const x0 = sx + gx * cell;
      const y0 = sy + gy * cell;
      const r = cell * 0.22;
      for (let y = Math.floor(y0); y < Math.ceil(y0 + cell); y++) {
        for (let x = Math.floor(x0); x < Math.ceil(x0 + cell); x++) {
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const a = cellAlpha(x - x0, y - y0, cell, r);
          if (a > 0) blend(px, (y * size + x) * 4, ...color, a);
        }
      }
    }
  }
}

export function drawIcon(size, maskable) {
  const px = new Uint8Array(size * size * 4);
  const radius = size * (maskable ? 0.08 : 0.22);
  const inset = maskable ? size * 0.02 : 0;
  const s = size;

  // base gradient (top #101826 -> bottom #0b0f16)
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const t = y / s;
      const a = roundedRectAlpha(x, y, s, radius);
      if (a <= 0) continue;
      px[i] = Math.round((0x10 - 5 * t) * a);
      px[i + 1] = Math.round((0x1a - 7 * t) * a);
      px[i + 2] = Math.round((0x28 - 18 * t) * a);
      px[i + 3] = Math.round(255 * a);
    }
  }

  // grid
  const gridStep = s / 16;
  for (let g = 1; g < 16; g++) {
    const pos = Math.round(g * gridStep);
    for (let n = 0; n < s; n++) {
      if (pos >= inset && pos < s - inset) {
        blend(px, (pos * s + n) * 4, 24, 34, 54, 0.45);
        blend(px, (n * s + pos) * 4, 24, 34, 54, 0.45);
      }
    }
  }

  // brand word "NEWS" (gold)
  const words = GLYPH_WORD.length;
  const gap = 1;
  const colsTotal = words * 5 + (words - 1) * gap;
  const cell = s / (colsTotal + 4);
  const glyphH = 7 * cell;
  const gw = colsTotal * cell;
  const gx = (s - gw) / 2;
  const gy = s * (maskable ? 0.16 : 0.2);
  let cursor = gx;
  for (const glyph of GLYPH_WORD) {
    drawGlyph(px, s, glyph, {
      sx: cursor,
      sy: gy,
      cell,
      color: [255, 233, 168],
      glowColor: [245, 197, 66],
      glow: true,
    });
    cursor += glyph[0].length * cell + gap * cell;
  }

  // secondary line (blue) above the fold
  const bluePoints = [
    [s * 0.05, s * 0.6],
    [s * 0.3, s * 0.55],
    [s * 0.6, s * 0.6],
    [s * 0.95, s * 0.5],
  ].map(([px2, py2]) => [px2 + inset, py2 + inset]);
  strokePolyline(px, size, bluePoints, [56, 189, 248], s * 0.02, 0.4);

  // main line (red) crossing under the glyph
  const chartTop = gy + glyphH + s * 0.05;
  const chartBottom = s * 0.9;
  const span = chartBottom - chartTop;
  const redPoints = [
    [s * 0.06, chartTop + span * 0.92],
    [s * 0.22, chartTop + span * 0.62],
    [s * 0.4, chartTop + span * 0.72],
    [s * 0.58, chartTop + span * 0.38],
    [s * 0.78, chartTop + span * 0.48],
    [s * 0.96, chartTop + span * 0.12],
  ].map(([px2, py2]) => [px2 + inset, py2 + inset]);
  strokePolyline(px, size, redPoints, [244, 63, 94], s * 0.1, 0.25);
  strokePolyline(px, size, redPoints, [244, 63, 94], s * 0.045, 1);

  for (const [x, y] of redPoints) {
    fillCircle(px, size, x, y, s * 0.016, [255, 255, 255]);
    fillCircle(px, size, x, y, s * 0.01, [244, 63, 94]);
  }

  const [ax, ay] = redPoints[redPoints.length - 1];
  const arrow = [
    [ax - s * 0.02, ay + s * 0.07],
    [ax + s * 0.07, ay],
    [ax - s * 0.02, ay - s * 0.07],
  ];
  strokePolyline(px, size, [arrow[0], arrow[1]], [255, 255, 255], s * 0.011, 1);
  strokePolyline(px, size, [arrow[1], arrow[2]], [255, 255, 255], s * 0.011, 1);
  strokePolyline(px, size, [arrow[0], arrow[2]], [255, 255, 255], s * 0.011, 1);

  return encodePng(size, px);
}

// ---------- manifest / service worker / html injection ----------
const manifest = {
  name: 'NEWS - Realtime Market News',
  short_name: 'NEWS',
  description: 'Tin tức Forex & Macro theo thời gian thực',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0b0e14',
  theme_color: '#0b0e14',
  lang: 'vi',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

const SW = `const CACHE='aster-v4';
self.addEventListener('install',()=>{self.skipWaiting();});
self.addEventListener('activate',(e)=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',(e)=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const res=await fetch(e.request);
        if(res.ok){const c=await caches.open(CACHE);c.put(e.request,res.clone());}
        return res;
      }catch(err){
        const hit=await caches.match(e.request);
        if(hit)return hit;
        const idx=await caches.match('/');
        if(idx)return idx;
        throw err;
      }
    })());
    return;
  }
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await caches.match(e.request);
    const net=async()=>{
      const res=await fetch(e.request);
      if(res&&res.ok&&res.type==='basic')c.put(e.request,res.clone());
      return res;
    };
    if(hit){net().catch(()=>{});return hit;}
    return net();
  })());
});`;

const PRELOAD_SCRIPT = `<script>
(function () {
  window.__asterDeferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__asterDeferredPrompt = e;
    window.dispatchEvent(new Event('aster-prompt-ready'));
  });
  window.addEventListener('appinstalled', function () {
    window.__asterInstalled = true;
  });
})();
</script>`;

const HEAD_INJECT = [
  `<meta name="theme-color" content="#0b0e14" />`,
  `<meta name="description" content="NEWS - Tin tức Forex & Macro theo thời gian thực" />`,
  `<meta name="mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`,
  `<meta name="apple-mobile-web-app-title" content="NEWS" />`,
  `<link rel="manifest" href="/manifest.webmanifest" />`,
  `<link rel="icon" type="image/png" href="/icons/icon-192.png" />`,
  `<link rel="apple-touch-icon" href="/icons/icon-180.png" />`,
].join('\n    ');

export function main() {
  mkdirSync(ICONS, { recursive: true });

  writeFileSync(join(ICONS, 'icon-192.png'), drawIcon(192, false));
  writeFileSync(join(ICONS, 'icon-180.png'), drawIcon(180, false));
  writeFileSync(join(ICONS, 'icon-512.png'), drawIcon(512, false));
  writeFileSync(join(ICONS, 'icon-maskable-512.png'), drawIcon(512, true));

  writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(DIST, 'sw.js'), SW);

  const htmlPath = join(DIST, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  html = html.replace('<head>', `<head>\n    ${PRELOAD_SCRIPT}`);
  html = html.replace('</head>', `${HEAD_INJECT}\n  </head>`);
  html = html.replace(
    '</body>',
    `<script>if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}</script>\n</body>`
  );
  writeFileSync(htmlPath, html);

  console.log('[build-web] PWA assets written:', ['icon-192.png', 'icon-180.png', 'icon-512.png', 'icon-maskable-512.png', 'manifest.webmanifest', 'sw.js'].join(', '));
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url.replace(/\\/g, '/') ===
    'file:///' + process.argv[1].replace(/\\/g, '/');

if (isDirectRun) {
  main();
}