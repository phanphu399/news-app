# Configuration, Constants & Known Debt

> All unverifiable items are tagged. Source code is the single source of truth.

## Config Surfaces

| File | What it holds |
|---|---|
| `mobile/src/config/constants.js` | `COLORS`, `GRADIENTS`, `CATEGORY_STYLES`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `BACKEND_URL`, `REFRESH_INTERVAL_MS`, `FONT_FAMILY`, tab colors |
| `mobile/app.json` → `expo.extra` | `backendUrl`, `supabaseUrl`, `supabaseAnonKey` (hardcoded; anon key is RLS-safe) |
| `mobile/app.json` | Expo config: plugins, splash, iOS/Android build settings |
| `mobile/eas.json` | EAS Build profiles (dev/preview/production), CLI version |
| `mobile/vercel.json` | Frontend deploy: buildCommand, outputDirectory, headers |
| `backend/src/config/constants.js` | `KNOWN_SOURCES`, `KNOWN_DOMAINS`, `DIRECT_RSS_FEEDS`, `EXTRA_FEEDS`, `RED_ALERT_KEYWORDS`, `FED_MACRO_QUERIES`, `HOT_GOOGLE_QUERIES`, `GEOPOLITICS_QUERIES`, `PAYWALL_QUERIES` |
| `backend/.env.example` | Template for required env vars |
| `backend/vercel.json` | Cron schedule only (`0 1 * * *`) |

## Environment Variables

**Backend** (`backend/.env.example`):

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Service role key (bypasses RLS) |
| `FCM_PROJECT_ID` | Yes | — | Firebase project ID (FCM V1 HTTP) |
| `FCM_CLIENT_EMAIL` | Yes | — | Firebase service account email |
| `FCM_PRIVATE_KEY` | Yes | — | Firebase service account private key |
| `FCM_SERVER_KEY` | No | — | Legacy FCM key (deprecated, fallback) |
| `CRON_SECRET` | **Yes** | — | Bắt buộc cho `/api/cron-fetch`, `/api/manual-fetch`, `/api/cleanup` (fail-closed, so sánh constant-time; nhận từ header `x-cron-secret`, `Authorization: Bearer`, hoặc `?secret=`) |
| `USER_FEEDS_WRITE_SECRET` | No | = `CRON_SECRET` | Auth riêng cho ghi `/api/user-feeds` |
| `FCM_TOPIC` | No | `market_alerts` | FCM topic name |
| `TRANSLATE_API_KEY` | No | — | `NOT IMPLEMENTED` — declared in `.env.example` but no code consumes it |

**Frontend** env vars (fallbacks for native dev only; web uses `app.json` extra):

| Variable | Used in |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `constants.js` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `constants.js` |
| `EXPO_PUBLIC_BACKEND_URL` | `constants.js` |

## Constants Modules

### `mobile/src/config/constants.js`

Exports (key items):

| Export | Type | Notes |
|---|---|---|
| `COLORS` | Object | 26 color tokens, all hex or rgba strings |
| `GRADIENTS` | Object | 5 gradients (header, brand, gold, importantRibbon, cardTop) |
| `CATEGORY_STYLES` | Object | 7 categories: Macro, XAUUSD, Forex, Crypto, Geopolitics, Paywall, Custom |
| `FONT_FAMILY` | String | `'Inter', 'Roboto', system-ui, ...` (web only; `undefined` on native) |
| `TABULAR_NUMS` | Array | `['tabular-nums']` for number alignment |
| `REFRESH_INTERVAL_MS` | Number | `300000` (5 min) |
| `APP_NAME` | String | `'MacroPulse'` |
| `APP_TAGLINE` | String | `'Tin thị trường · Forex · Macro'` |
| Category convenience tokens | Various | `BACKGROUND_COLOR`, `CARD_BACKGROUND`, `TEXT_PRIMARY`, etc. |

### `backend/src/config/constants.js`

Exports (key items):

| Export | Type | Count |
|---|---|---|
| `KNOWN_SOURCES` | Array of {name, url, category} | Multiple RSS feeds |
| `KNOWN_DOMAINS` | Map | Domain → category classification |
| `DIRECT_RSS_FEEDS` | Array | Direct RSS URLs (non-Google) |
| `EXTRA_FEEDS` | Array | Additional feeds beyond Google News |
| `RED_ALERT_KEYWORDS` | Array | ~17 terms for flagging urgent news |
| `FED_MACRO_QUERIES` | Array | 8 Google News queries for Fed/macro news |
| `HOT_GOOGLE_QUERIES` | Array | 5 trending market queries |
| `GEOPOLITICS_QUERIES` | Array | Geopolitical event queries |
| `PAYWALL_QUERIES` | Array | Bloomberg/WSJ/Reuters site: queries |

## Database Schema Files

| File | Purpose | Runtime used? |
|---|---|---|
| `db/schema.sql` | `market_news` table + indexes; **KHÔNG còn tạo hàm SECURITY DEFINER/trigger dọn 3 ngày** — cleanup do backend cron xử lý | Yes |
| `db/realtime_rls.sql` | Row-level security policies for Realtime subscriptions | Yes |
| `db/security_fix.sql` | Gỡ: drop trigger `trg_delete_old_market_news` TRƯỚC rồi mới drop hàm `delete_old_market_news()` (chạy trên DB đã apply schema cũ) | Yes |
| `db/add_title_vi.sql` | Adds `title_vi` column to `market_news` | **Yes, column exists but never populated** |
| `db/drop_title_vi.sql` | Drops `title_vi` column | `UNKNOWN` — both add and drop exist |
| `db/add_user_feeds.sql` | `user_feeds` table for user RSS management | Yes (API) |
| `db/alter_market_news_created_at.sql` | Alters `created_at` column | Yes |
| `db/maintenance.sql` | Maintenance operations | `UNKNOWN` |
| `db/memory_check.sql` | Supabase memory/resource check | Utility only |
| `db/expensive_queries.sql` | Slow query identification | Utility only |

## Deployed Endpoints vs. Repo

| Endpoint | In repo | Live? | Notes |
|---|---|---|---|
| `/api/cron-fetch` | Yes | Yes (daily cron) | Cron **phải tạo lại trong Vercel Dashboard**: `/api/cron-fetch?secret=<CRON_SECRET>&tier=full`, schedule `0 1 * * *` (không commit secret vào vercel.json) |
| `/api/manual-fetch` | Yes | `REQUIRES RUNTIME VERIFICATION` | Requires backend redeploy to `news-app-realtime-seven`; giờ yêu cầu `CRON_SECRET` |
| `/api/markets` | Yes | `REQUIRES RUNTIME VERIFICATION` | Same redeploy needed; **no longer referenced by mobile** since the gold/silver price panel was removed from `EconomicCalendarView` |
| `/api/article` | Yes | `REQUIRES RUNTIME VERIFICATION` | Backend redeploy needed |
| `/api/cleanup` | Yes | `REQUIRES RUNTIME VERIFICATION` | Requires `CRON_SECRET` for auth (fail-closed) |
| `/api/sources` | Yes | `REQUIRES RUNTIME VERIFICATION` | — |
| `/api/calendar` | Yes | `REQUIRES RUNTIME VERIFICATION` | — |
| `/api/rss-proxy` | Yes | `REQUIRES RUNTIME VERIFICATION` | **NOT referenced by mobile app** (grep confirmed); SSRF-guarded |
| `/api/user-feeds` | Yes | `REQUIRES RUNTIME VERIFICATION` | GET/test mở; ghi (POST/PATCH/DELETE) yêu cầu secret |

## Known Debt, Stale References & Unknowns

### Stale files

| File | Issue |
|---|---|
| `README.md` (root) | References removed `CustomFeedService.js`, `CustomFeedView`, `AddFeedModal` — all deleted. Describes outdated UI. |
| `.github/workflows/ci.yml` | **Đã sửa (2026-09-14)**: bỏ `src/services/CustomFeedService.js` không tồn tại; check toàn bộ backend `.js`; thêm step `verify:dist`. |
| `mobile/index.html` | Contains stale inline script with `var build = 'v10'` and old auto-reload logic (`location.reload()` via sessionStorage). **Does NOT ship to dist** — Expo generates `dist/index.html` fresh and `build-web.mjs` injects the v14 preload. But the source file is misleading and should be deleted or renamed. |

### Code-level unused/dead

| Item | Details |
|---|---|
| `title_vi` column | Added by migration, never written to by any code path (scraper, backend, Supabase service). `NOT IMPLEMENTED` in the pipeline. |
| `rss-proxy.js` | Exists in `backend/api/` but **NOT referenced** by any mobile code (verified via grep). May serve external consumers — `UNKNOWN`. |
| `TrashIcon` import | Imported in `WatchlistView.js` but never rendered — dead import. |
| `@aster/custom_feeds` legacy | `LocalStorageService` exports `addCustomFeed`, `removeCustomFeed`, `loadCustomFeeds`, `clearCustomFeeds` for this key. **No view imports or calls these functions.** Legacy dead code. |
| `TRANSLATE_API_KEY` | Declared in `backend/.env.example` as optional, but **no backend code reads or uses it**. |
| `user_feeds` table + API | Full CRUD exists (`user_feeds.js`, `add_user_feeds.sql`), but `SourcesView` renders only static source list. The Custom Feed UI (`AddFeedModal`, `CustomFeedView`) was deleted. `NOT IMPLEMENTED`: user-facing feature. |

### Behavior gaps

| Item | Details |
|---|---|
| Native always online | `useOnlineStatus()` returns `{online: true}` on iOS/Android — `NOT FOUND`: `NetInfo.addEventListener`. Only meaningful on web. |
| No search UI | No `SearchService` exists. `NOT IMPLEMENTED`: keyword filter in `NewsListView` or any view. |
| Single daily cron | Only `0 1 * * *` registered. No hot/standard tier crons, no intraday fetch cycle. |
| No crash reporting | No Sentry, LogRocket, or remote logging. `NOT IMPLEMENTED`. |
| No deep linking | No URL scheme handling, no `Linking.addEventListener`. |
| Google News limitation | `maxItems=20` per feed; 500ms delay between feed requests; no pagination. |
| FCM topic subscription | Backend sends to `market_alerts` topic via admin SDK. `REQUIRES RUNTIME VERIFICATION`: mobile app does not explicitly subscribe to FCM topics in JS — push delivery may require native configuration or manual topic subscription not visible in this codebase. |

### Potential doc corrections

| Doc | Issue |
|---|---|
| `architecture.md` line 27 | ~~Icons list stated "72, 96, 128, 144, 152, 192, 384, 512"~~ — corrected to "180, 192, 512, maskable-512" (actual `build-web.mjs` output). |

## Runtime Verification Checklist

These items require actually running the app against a live backend to confirm:

| # | Item | How to test |
|---|---|---|
| 1 | Backend endpoints live? | `curl https://news-app-realtime-seven.vercel.app/api/markets` |
| 2 | Cron registered? | Vercel dashboard → `news-app-realtime-seven` → Cron Jobs |
| 3 | FCM push delivery | Trigger `manual-fetch` → check if mobile receives notification |
| 4 | Supabase Realtime | Open app → verify `● Trực tiếp` indicator appears (no `OFFLINE` in log) |
| 5 | PWA install flow | Chrome DevTools → Application → Manifest → "Install" |
| 6 | PWA update flow | Deploy new version → open app → verify banner appears without reload |
| 7 | `rss-proxy` consumers | Check if any external service calls `/api/rss-proxy` |
| 8 | `user_feeds` consumers | Check if any code path inserts into `user_feeds` table |
