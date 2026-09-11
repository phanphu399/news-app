import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng, makeSquareIcon, fitMaskable, cropToContent } from './png.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ICONS = join(DIST, 'icons');
export const SOURCE_PNG = join(ROOT, 'assets', 'breaking-news-logo-design.png');

// ---------- icons từ logo thật (breaking-news-logo-design.png) ----------
export function loadSourceIcon() {
  return decodePng(readFileSync(SOURCE_PNG));
}

export function writeSquareIcon(path, size, maskable = false) {
  const src = (() => {
    try {
      return loadSourceIcon();
    } catch {
      throw new Error(`Không đọc được ${SOURCE_PNG}`);
    }
  })();
  let px;
  if (maskable) {
    const cropped = cropToContent(src.data, src.width, src.height);
    px = fitMaskable(cropped.data, cropped.width, cropped.height, size, 0.82);
  } else {
    px = makeSquareIcon(src.data, src.width, src.height, size, 0.98);
  }
  writeFileSync(path, encodePng(size, px));
}

export function buildWebIcons() {
  mkdirSync(ICONS, { recursive: true });
  writeSquareIcon(join(ICONS, 'icon-192.png'), 192);
  writeSquareIcon(join(ICONS, 'icon-180.png'), 180);
  writeSquareIcon(join(ICONS, 'icon-512.png'), 512);
  writeSquareIcon(join(ICONS, 'icon-maskable-512.png'), 512, true);
}

// ---------- manifest / service worker / html injection ----------
// Phiên bản hiển thị trên UI (AppHeader). Tăng khi đổi SW cache để người dùng
// tự xác minh bản đang chạy trên máy là mới nhất.
const BUILD_VERSION = 'v7';

const manifest = {
  name: 'NEWS - Realtime Market News',
  short_name: 'NEWS',
  description: 'Tin tức Forex & Macro theo thời gian thực',
  id: '/',
  start_url: `/?__v=${BUILD_VERSION}`,
  scope: '/',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui'],
  orientation: 'portrait',
  background_color: '#0B0E14',
  theme_color: '#0B0E14',
  lang: 'vi',
  categories: ['news', 'finance'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

const SW = `const CACHE='aster-v7';
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
  var build = '${BUILD_VERSION}';
  window.__ASTER_BUILD = build;
  window.__asterDeferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__asterDeferredPrompt = e;
    window.dispatchEvent(new Event('aster-prompt-ready'));
  });
  window.addEventListener('appinstalled', function () {
    window.__asterInstalled = true;
  });
  // Tự kiểm tra phiên bản server (manifest luôn fresh nhờ header no-cache).
  // Nếu server mới hơn bản đang chạy -> reload 1 lần để thoát cache cũ.
  try {
    fetch('/manifest.webmanifest?p=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        var target = build;
        if (m && m.start_url && m.start_url.indexOf('__v=') >= 0) {
          target = m.start_url.slice(m.start_url.indexOf('__v=') + 4);
        }
        if (target && target !== build && !sessionStorage.getItem('aster-reload-' + build)) {
          sessionStorage.setItem('aster-reload-' + build, '1');
          try { location.reload(); } catch (e) {}
        }
      })
      .catch(function () {});
  } catch (e) {}
})();
</script>`;

const HEAD_INJECT = [
  `<meta name="theme-color" content="#0B0E14" />`,
  `<style>html,body,#root{background:#0B0E14;color-scheme:dark}</style>`,
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
  buildWebIcons();

  writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(DIST, 'sw.js'), SW);

  // Đảm bảo Vercel (kể cả khi upload dist thủ công) trả đúng Content-Type
  // cho PWA manifest — Chrome từ chối cài đặt nếu sai loại MIME.
  // index.html phải luôn fresh (no-cache) để không ai bị kẹt bản cũ.
  writeFileSync(
    join(DIST, 'vercel.json'),
    JSON.stringify(
      {
        headers: [
          {
            source: '/manifest.webmanifest',
            headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
          },
          {
            source: '/(.*)',
            headers: [
              { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=0, must-revalidate' },
            ],
          },
        ],
      },
      null,
      2
    )
  );

  const htmlPath = join(DIST, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  html = html.replace('<head>', `<head>\n    ${PRELOAD_SCRIPT}`);
  html = html.replace('</head>', `${HEAD_INJECT}\n  </head>`);
  html = html.replace(
    '</body>',
    `<script>if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}</script>\n</body>`
  );
  writeFileSync(htmlPath, html);

  verifyDist();
}

// Chang quang: bất kỳ đường build nào (Vercel auto-deploy, upload thủ công,
// npm run build cục bộ) đều PHẢI ra dist đầy đủ PWA. Nếu thiếu bất kỳ thành
// phần nào => build trả lỗi, không cho phép sinh ra bản "raw expo export"
// mà không có sw.js / manifest / version probe (chính là thứ đã gây lỗi).
export function verifyDist() {
  const failures = [];
  const has = (p) => {
    try {
      readFileSync(join(DIST, p));
      return true;
    } catch {
      return false;
    }
  };
  if (!has('manifest.webmanifest')) failures.push('manifest.webmanifest');
  if (!has('sw.js')) failures.push('sw.js');
  if (!has('icons/icon-192.png')) failures.push('icons/icon-192.png');
  if (!has('icons/icon-512.png')) failures.push('icons/icon-512.png');
  if (!has('icons/icon-maskable-512.png')) failures.push('icons/icon-maskable-512.png');
  if (!has('vercel.json')) failures.push('vercel.json');

  const htmlPath = join(DIST, 'index.html');
  try {
    const html = readFileSync(htmlPath, 'utf8');
    if (!html.includes('serviceWorker.register')) failures.push('index.html thiếu SW registration');
    if (!html.includes('/manifest.webmanifest')) failures.push('index.html thiếu manifest link');
    if (!html.includes(`var build = '${BUILD_VERSION}'`)) failures.push('index.html thiếu build version');
  } catch {
    failures.push('index.html');
  }

  if (failures.length) {
    console.error('[verify-dist] FAIL — dist KHÔNG HỢP LỆ, đang thiếu:');
    failures.forEach((f) => console.error('   - ' + f));
    console.error('[verify-dist] Lưu ý: bản ' + BUILD_VERSION + ' chỉ hợp lệ khi sinh từ "npm run build".');
    process.exit(1);
  }
  console.log('[verify-dist] OK — ' + BUILD_VERSION + ' (sw.js, manifest, icons, vercel.json, version probe)');
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url.replace(/\\/g, '/') ===
    'file:///' + process.argv[1].replace(/\\/g, '/');

if (isDirectRun) {
  if (process.argv.includes('--verify')) {
    verifyDist();
  } else {
    main();
  }
}