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
function drawIcon(size, maskable) {
  const px = new Uint8Array(size * size * 4);
  const radius = size * (maskable ? 0.08 : 0.22);
  const inset = maskable ? size * 0.02 : 0;

  // base
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const a = roundedRectAlpha(x, y, size, radius);
      blend(px, i, 13, 18, 26, a); // #0d121a
    }
  }

  const s = size;
  const gridStep = s / 16;
  for (let g = 1; g < 16; g++) {
    const pos = Math.round(g * gridStep);
    for (let n = 0; n < s; n++) {
      if (pos >= inset && pos < s - inset) {
        blend(px, (pos * s + n) * 4, 24, 34, 54, 0.5);
        blend(px, (n * s + pos) * 4, 24, 34, 54, 0.5);
      }
    }
  }

  // secondary line (blue)
  const bluePoints = [
    [s * 0.06, s * 0.62],
    [s * 0.26, s * 0.72],
    [s * 0.45, s * 0.55],
    [s * 0.66, s * 0.66],
    [s * 0.9, s * 0.5],
  ].map(([x, y]) => [x + inset, y + inset]);
  strokePolyline(px, size, bluePoints, [56, 189, 248], s * 0.035, 0.35);

  // main line (red) with glow
  const redPoints = [
    [s * 0.04, s * 0.78],
    [s * 0.2, s * 0.62],
    [s * 0.36, s * 0.66],
    [s * 0.52, s * 0.46],
    [s * 0.7, s * 0.52],
    [s * 0.9, s * 0.3],
    [s * 0.98, s * 0.28],
  ].map(([x, y]) => [x + inset, y + inset]);
  strokePolyline(px, size, redPoints, [244, 63, 94], s * 0.095, 0.28); // glow
  strokePolyline(px, size, redPoints, [244, 63, 94], s * 0.048, 1);

  // data points
  for (const [x, y] of redPoints) {
    fillCircle(px, size, x, y, s * 0.018, [255, 255, 255]);
    fillCircle(px, size, x, y, s * 0.011, [244, 63, 94]);
  }

  // arrow head
  const [ax, ay] = redPoints[redPoints.length - 1];
  const arrow = [
    [ax - s * 0.02, ay + s * 0.075],
    [ax + s * 0.075, ay],
    [ax - s * 0.02, ay - s * 0.075],
  ];
  strokePolyline(px, size, [arrow[0], arrow[1]], [255, 255, 255], s * 0.012, 1);
  strokePolyline(px, size, [arrow[1], arrow[2]], [255, 255, 255], s * 0.012, 1);
  strokePolyline(px, size, [arrow[0], arrow[2]], [255, 255, 255], s * 0.012, 1);

  return encodePng(size, px);
}

// ---------- manifest / service worker / html injection ----------
const manifest = {
  name: 'ASTER - Realtime Market News',
  short_name: 'ASTER',
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

const SW = `const CACHE='aster-v3';
self.addEventListener('install',()=>{self.skipWaiting();});
self.addEventListener('activate',(e)=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',(e)=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(e.request);
    if(hit)return hit;
    try{
      const res=await fetch(e.request);
      if(res.ok&&res.type==='basic')c.put(e.request,res.clone());
      return res;
    }catch(err){
      const fallback=await c.match('/');
      if(fallback)return fallback;
      throw err;
    }
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
  `<meta name="description" content="ASTER - Tin tức Forex & Macro theo thời gian thực" />`,
  `<meta name="mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`,
  `<meta name="apple-mobile-web-app-title" content="ASTER" />`,
  `<link rel="manifest" href="/manifest.webmanifest" />`,
  `<link rel="icon" type="image/png" href="/icons/icon-192.png" />`,
  `<link rel="apple-touch-icon" href="/icons/icon-180.png" />`,
].join('\n    ');

function main() {
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

main();