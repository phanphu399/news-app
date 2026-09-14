# PWA, Build & Deploy

## Version Sync (Critical)

Three files must stay in sync when bumping the version:

| Location | Current Value | Purpose |
|---|---|---|
| `mobile/src/utils/webPwa.js:6` | `WEB_BUILD_VERSION = 'v14'` | Runtime probe: polls manifest, shows update banner |
| `mobile/scripts/build-web.mjs:78` | `BUILD_VERSION = 'v14'` | Build-time: SW cache name, manifest `start_url`, injected preload script |
| `mobile/public/sw.js:1` | `CACHE = 'aster-v14'` | Service worker cache bucket name |

**manifest.webmanifest `start_url`** is set to `/?__v=v14` by `build-web.mjs`. The runtime preload probes this value and compares against `WEB_BUILD_VERSION`.

## Service Worker

**File:** `mobile/public/sw.js` (42 lines, hand-written — no Workbox).

### Behavior

- **Cache name:** `aster-v14` (single bucket, all versions share the name).
- **Install:** `self.skipWaiting()` — new SW activates immediately.
- **Activate:** Deletes all caches not named `aster-v14`, then `self.clients.claim()`.
- **Fetch strategy — same-origin only, GET only:**
  - **Navigation / HTML:** Network-first. On success, cache the response. On failure, serve from cache (`/` → `/index.html` fallback chain).
  - **Other same-origin resources:** Network-first. On success + `response.type === 'basic'`, cache the response. On failure, serve from cache.
  - **Cross-origin requests:** Passed through to the network; **never cached** (avoids corrupting Supabase/backend/translate responses).

### Implications

- Deploying a new build updates all visitors on next page load — the new SW takes over immediately.
- No offline-first for API data (Supabase, backend). Offline support covers only the app shell and static assets already cached.

## Preload / Runtime Wiring

There are two layers of PWA wiring, one for the **built dist** and one as a **runtime fallback**:

### Build-time injection (`build-web.mjs`)

During `npm run build`, the script injects into `dist/index.html`:
1. **Preload IIFE** (after `<head>`) — sets `window.__ASTER_BUILD`, intercepts `beforeinstallprompt`, polls manifest for version mismatch → dispatches `aster-update-ready`.
2. **`<head>` tags** — theme-color, dark scrollbar CSS, description meta, manifest link, favicons, preconnect hints for Supabase/backend/translate.googleapis.
3. **SW registration** (before `</body>`).

This is idempotent: repeated runs check for markers before injecting.

### Runtime fallback (`webPwa.js`)

`ensureWebPwa()` (called in `mobile/index.js`) defensively injects any missing PWA tags at runtime. This handles the case where `index.html` is the raw Expo export template without build-web.mjs post-processing.

## Update UX

**No automatic reload.** The update flow is user-initiated:

1. On load, the preload script (or `ensureWebPwa`) fetches `manifest.webmanifest` with cache-bust (`?p=Date.now()`). Manifest is always fresh thanks to `Cache-Control: max-age=0` headers.
2. If the manifest's `__v` differs from the running build version, `aster-update-ready` is dispatched.
3. `App.js` (`MainScreen`, line 230) listens for the event and sets `updateVersion` state → renders an **Update Banner** with two buttons:
   - **Cập nhật** (`applyUpdate`): calls `SWRegistration.update()`, then `window.location.reload()`.
   - **Để sau** (`laterUpdate`): persists dismissal to localStorage key `aster-update-dismissed-<version>` → banner hides for that version.
4. On next visit (after dismissal), the banner does not reappear for the same version.

## Install UX

For browsers that support the `beforeinstallprompt` event (not iOS Safari):

1. `webPwa.js` prevents the default prompt, stores it as `window.__asterDeferredPrompt`, dispatches `aster-prompt-ready`.
2. `App.js` `useInstallPrompt()` hook listens → shows an **Install Card** at the bottom.
3. **Install button** calls `prompt.prompt()` → if accepted, persists dismissal via `persistInstallDismissed()` (localStorage key `aster-install-pref`, expires after **7 days**).
4. **Dismiss button** also persists for 7 days.
5. Card is hidden when: standalone mode detected, already installed, dismissed (within 7 days), or `window.__asterInstalled` set.

**iOS Safari:** `isIosSafari()` detects the browser. Since iOS doesn't support `beforeinstallprompt`, an **iOS guide card** is shown instead ("Mở Safari → Chia sẻ → Thêm vào Màn hình chính").

## Build Pipeline

### Commands

| Command | Runs | Location |
|---|---|---|
| `npm run build` (root) | `npm --prefix mobile run build` | `E:\news-app\` |
| `npm run build` (mobile) | `expo export --platform web && node scripts/build-web.mjs` | `E:\news-app\mobile\` |
| `npm run verify:dist` (root) | `node mobile/scripts/build-web.mjs --verify` | `E:\news-app\` |
| `npm run verify:dist` (mobile) | `node scripts/build-web.mjs --verify` | `E:\news-app\mobile\` |

### `build-web.mjs` Steps

1. **`buildWebIcons()`** — Reads `assets/logo-mark.png` (source) and `assets/logo-maskable.png` (maskable), generates 4 icon sizes into both `dist/icons/` and `public/icons/`:
   - `icon-192.png` — cropped + centered, 98% scale, 0px padding
   - `icon-180.png` — same, for Apple touch icon
   - `icon-512.png` — same, for install prompt
   - `icon-maskable-512.png` — resized from maskable source (full-bleed)
2. **Write PWA files** to `dist/` and `public/`: `manifest.webmanifest`, `sw.js`, `vercel.json`.
3. **Inject into `dist/index.html`** — preload script, `<head>` tags, SW registration (idempotent).
4. **`verifyDist()`** — Checks all required PWA files exist in `dist/` and `public/`, and `dist/index.html` contains the required markers. Exits with code 1 on failure.

### Icon Generation (`png.mjs`)

Custom pure-JS PNG encoder/decoder — no dependencies. Functions: `decodePng`, `encodePng`, `cropToContent`, `makeSquareIcon`, `resizeRgba`. Used by `build-web.mjs` and `generate-logo.mjs`.

### Asset Scripts

| Script | Purpose |
|---|---|
| `scripts/build-web.mjs` | Main build + PWA wiring + icon generation |
| `scripts/generate-logo.mjs` | Generate `assets/logo-mark.png` from source SVG/PNG |
| `scripts/generate-assets.mjs` | Generate other asset variants |
| `scripts/make-chime.mjs` | Generate `assets/sounds/chime-soft.wav` notification sound |
| `scripts/png.mjs` | Shared PNG encoding/decoding library |

## Web Hosting (Vercel)

### Frontend: `mobile/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/manifest.webmanifest",
      "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, s-maxage=0, must-revalidate" }
      ]
    }
  ]
}
```

- `outputDirectory: "dist"` — serves from the Expo export + build-web.mjs output.
- **`Cache-Control: max-age=0`** on all responses — ensures `index.html` and `manifest.webmanifest` are always fresh (critical for version detection to work).
- **Manifest Content-Type** set to `application/manifest+json` — Chrome refuses PWA installation if the MIME type is wrong.
- `build-web.mjs` also generates a copy of this `vercel.json` into `dist/` and `public/` to ensure consistency.

### Backend: `backend/vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron-fetch?tier=full",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Single daily cron at 01:00 UTC. Separate Vercel project (`news-app-realtime-seven`).

## Native Builds (EAS)

### `app.json`

| Field | Value |
|---|---|
| name | `NEWS - Market News` |
| slug | `aster-market-news` |
| bundleIdentifier | `com.aster.marketnews` |
| orientation | portrait |
| newArchEnabled | `true` |
| web.bundler | metro |
| web.output | single |

### Plugins

| Plugin | Config |
|---|---|
| `expo-dev-client` | — |
| `expo-notifications` | icon: `notification-icon.png`, color: `#e11d48`, sound: `chime-soft.wav` |
| `expo-asset` | — |
| `expo-status-bar` | — |

### iOS / Android specifics

| Platform | Config |
|---|---|
| iOS | `bundleIdentifier: com.aster.marketnews`, `UIBackgroundModes: ["remote-notification"]` |
| Android | `package: com.aster.marketnews`, `useNextNotificationsApi: true`, adaptive icon bg `#0B1426` |

### `eas.json`

- **CLI:** `>= 12.0.0`, `appVersionSource: "remote"`
- **Profiles:** `development` (devClient, internal), `preview` (internal), `production` (autoIncrement)
- **Submit:** production (empty config)

### Runtime config injection

`mobile/src/config/constants.js` reads Supabase/backend URLs from `app.json` → `expo.extra` with env var fallbacks:

```js
SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://news-app-realtime-seven.vercel.app';
```

## CI

**File:** `.github/workflows/ci.yml`

Two parallel jobs, both on `ubuntu-latest` with Node 20:

### Backend job

1. `npm ci` in `backend/`
2. Syntax check: `cron-fetch.js`, `scraper.js`, `supabase.js`, `fcm.js`, `helpers.js`
3. Validate `vercel.json` has crons

### Mobile job

1. `npm ci || npm install --no-audit --no-fund` in `mobile/`
2. Syntax check: `App.js`, `index.js`, `webPwa.js`, `NewsViewModel.js`, **`CustomFeedService.js`**, `build-web.mjs`, `generate-logo.mjs`, `EconomicCalendarView.js`
3. Validate `app.json` and `mobile/vercel.json`

> **BROKEN:** The mobile syntax check references `src/services/CustomFeedService.js` which does **NOT FOUND** — this step would fail if CI runs. See [config-and-unknowns.md](./config-and-unknowns.md).

## Verification Commands

```bash
# Full web build
npm run build                    # from root

# Verify dist without rebuilding
npm run verify:dist              # from root

# Check mobile icons exist
Get-ChildItem mobile/public/icons/

# Inspect generated dist
Get-ChildItem mobile/dist/
Get-Content mobile/dist/index.html -First 40
Get-Content mobile/dist/manifest.webmanifest | ConvertFrom-Json
```
