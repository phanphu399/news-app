// Gắn PWA vào bundle để app chạy được như PWA NGAY CẢ KHI index.html là
// bản "raw expo export" (không có manifest link / service worker / theme-color
// do Expo luôn tự sinh index.html mà không dùng template).
// public/ (manifest, sw.js, icons) luôn được expo export copy vào dist nên
// chỉ cần nối wiring này là Chrome nhận app là cài được.
export const WEB_BUILD_VERSION = 'v9';

export function ensureWebPwa() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const head = document.head || document.documentElement;
  const addHtml = (tag, attrs) => {
    if (!head) return;
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    head.appendChild(el);
  };

  if (!document.querySelector('link[rel="manifest"]')) {
    addHtml('link', { rel: 'manifest', href: '/manifest.webmanifest' });
  }
  if (!document.querySelector('meta[name="theme-color"]')) {
    addHtml('meta', { name: 'theme-color', content: '#10151C' });
  }
  if (!document.querySelector('link[rel="icon"]')) {
    addHtml('link', { rel: 'icon', type: 'image/png', href: '/icons/icon-192.png' });
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    addHtml('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
    addHtml('meta', { name: 'apple-mobile-web-app-title', content: 'NEWS' });
  }
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    addHtml('link', { rel: 'apple-touch-icon', href: '/icons/icon-180.png' });
  }

  window.__ASTER_BUILD = WEB_BUILD_VERSION;
  window.__asterDeferredPrompt = window.__asterDeferredPrompt || null;

  if (!window.__asterPromptWired) {
    window.__asterPromptWired = true;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      window.__asterDeferredPrompt = event;
      window.dispatchEvent(new Event('aster-prompt-ready'));
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    });
  }

  // Tự kiểm tra phiên bản server: manifest luôn fresh (header no-cache).
  // Nếu server mới hơn bản đang chạy -> reload 1 lần để thoát cache cũ.
  try {
    fetch('/manifest.webmanifest?p=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((manifest) => {
        let target = WEB_BUILD_VERSION;
        if (manifest && manifest.start_url && manifest.start_url.indexOf('__v=') >= 0) {
          target = manifest.start_url.slice(manifest.start_url.indexOf('__v=') + 4);
        }
        if (
          target &&
          target !== WEB_BUILD_VERSION &&
          !window.sessionStorage.getItem('aster-reload-' + WEB_BUILD_VERSION)
        ) {
          window.sessionStorage.setItem('aster-reload-' + WEB_BUILD_VERSION, '1');
          try {
            window.location.reload();
          } catch (error) {}
        }
      })
      .catch(() => {});
  } catch (error) {}
}