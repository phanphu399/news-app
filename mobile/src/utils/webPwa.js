// Gắn PWA vào bundle để app chạy được như PWA NGAY CẢ KHI index.html là
// bản "raw expo export" (không có manifest link / service worker / theme-color
// do Expo luôn tự sinh index.html mà không dùng template).
// public/ (manifest, sw.js, icons) luôn được expo export copy vào dist nên
// chỉ cần nối wiring này là Chrome nhận app là cài được.
export const WEB_BUILD_VERSION = 'v11';

// ---------- Phiên bản cập nhật (update UX) ----------
// Không reload tự động. Chỉ đánh dấu phiên bản mới; App.js hiện
// "Phiên bản mới đã sẵn sàng" [Cập nhật][Để sau] — user tự quyết định.
const UPDATE_DISMISS_KEY = (version) => `aster-update-dismissed-${version}`;

export function isUpdateDismissed(version) {
  try {
    return window.localStorage.getItem(UPDATE_DISMISS_KEY(version)) === '1';
  } catch {
    return false;
  }
}

export function persistUpdateDismissed(version) {
  try {
    window.localStorage.setItem(UPDATE_DISMISS_KEY(version), '1');
  } catch {}
}

export function notifyUpdateReady(version) {
  window.__asterPendingUpdate = version;
  try {
    window.dispatchEvent(new CustomEvent('aster-update-ready', { detail: version }));
  } catch {}
}

// ---------- Cài đặt app (install UX) ----------
// Dismiss có nhớ 7 ngày — không làm phiền lặp lại mỗi lần vào app,
// và luôn ẩn khi đã chạy ở chế độ standalone / đã cài.
const INSTALL_PREF_KEY = 'aster-install-pref';

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  if (window.navigator.standalone === true) return true;
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

export function isIosSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  return /(iphone|ipad|ipod)/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
}

export function getInstallPreference() {
  try {
    const raw = window.localStorage.getItem(INSTALL_PREF_KEY);
    if (!raw) return null;
    const pref = JSON.parse(raw);
    if (pref && pref.until && pref.until > Date.now()) return pref;
  } catch {}
  return null;
}

export function persistInstallDismissed() {
  try {
    window.localStorage.setItem(
      INSTALL_PREF_KEY,
      JSON.stringify({ dismissed: 1, until: Date.now() + 7 * 24 * 60 * 60 * 1000 })
    );
  } catch {}
}

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
    addHtml('meta', { name: 'theme-color', content: '#0B1426' });
  }
  if (!document.querySelector('link[rel="icon"]')) {
    addHtml('link', { rel: 'icon', type: 'image/png', href: '/icons/icon-192.png' });
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    addHtml('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
    addHtml('meta', { name: 'apple-mobile-web-app-title', content: 'MacroPulse' });
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
  // Không reload tự động (giữ phiên làm việc) — chỉ báo để App.js nhắc user.
  try {
    fetch('/manifest.webmanifest?p=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((manifest) => {
        let target = WEB_BUILD_VERSION;
        if (manifest && manifest.start_url && manifest.start_url.indexOf('__v=') >= 0) {
          target = manifest.start_url.slice(manifest.start_url.indexOf('__v=') + 4);
        }
        if (target && target !== WEB_BUILD_VERSION) {
          notifyUpdateReady(target);
        }
      })
      .catch(() => {});
  } catch (error) {}

  if (!window.__asterInstalledWired) {
    window.__asterInstalledWired = true;
    window.addEventListener('appinstalled', () => {
      window.__asterInstalled = true;
    });
  }
}