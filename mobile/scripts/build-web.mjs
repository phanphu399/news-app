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
const manifest = {
  name: 'NEWS - Realtime Market News',
  short_name: 'NEWS',
  description: 'Tin tức Forex & Macro theo thời gian thực',
  id: '/',
  start_url: '/',
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

// Phiên bản hiển thị trên UI (AppHeader). Tăng khi đổi SW cache để người dùng
// tự xác minh bản đang chạy trên máy là mới nhất.
const BUILD_VERSION = 'v6';

const SW = `const CACHE='aster-v6';
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
  window.__ASTER_BUILD = '${BUILD_VERSION}';
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

  console.log('[build-web] PWA assets written: icon-192, icon-180, icon-512, icon-maskable-512, manifest.webmanifest, sw.js');
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url.replace(/\\/g, '/') ===
    'file:///' + process.argv[1].replace(/\\/g, '/');

if (isDirectRun) {
  main();
}