# Backend & Data Layer

All endpoints are Vercel serverless functions (ESM). Runtime Node ≥18 with `fetch`.

## Environment (backend)

| Var | Used For |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-side, full access) |
| `CRON_SECRET` | **Bắt buộc.** Auth cho cron-fetch / manual-fetch / cleanup (header `x-cron-secret`, `Authorization: Bearer`, hoặc `?secret=`). Fail-closed khi thiếu. |
| `FCM_PROJECT_ID` | Firebase project ID (V1 push) |
| `FCM_CLIENT_EMAIL` | Firebase service account client email (JWT issuer) |
| `FCM_PRIVATE_KEY` | Private key for JWT signing (newline JSON escaped as `\n`) |
| `FCM_SERVER_KEY` | Legacy server key (fallback auth) |

## API Endpoint Inventory

### GET /api/markets
- Proxies Yahoo Finance `GC=F` (Vàng) and `SI=F` (Bạc) chart quote.
- Returns `{ok, cached, markets: {GC=F: {symbol,name,unit,price,prevClose,change,changePct,updatedAt}, SI=F: {...}}}`.
- Cache: 60s in-memory. On upstream failure, returns stale cache with `stale:true`; if no cache → `502`.
- `Cache-Control: public, max-age=60`.
- Upstream: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`, UA spoofed "Mozilla/5.0 (news-app markets proxy)", 8s timeout.
- **No longer consumed by mobile** — the gold/silver price panel was removed from `EconomicCalendarView` (2026-09-11). Endpoint kept in backend.

### GET /api/calendar
- Proxies `https://economic-calendar.tradingview.com/events?from=...&to=...` (cửa sổ 13 ngày, 13 quốc gia).
- Filters impacts (`High`/`Medium`/`Low` → impact map), maps to `{title,country,date,impact,forecast,previous,actual}`, sorts ascending by date.
- In-memory cache 30s. `stale:true` fallback; `502` nếu không có cache.
- `Cache-Control: public, max-age=30, s-maxage=30, stale-while-revalidate=30` — **CDN phục vụ request** → origin tối đa 1 lần/30s cho mọi client. Client **không** dùng query cache-buster (`?t=...`) vì phá cache CDN; React Native/browser tôn trọng `max-age`.
- Upstream timeout 9s (Hobby limit 10s — vượt quá function bị kill).
- Mobile poll 30s/lần (`EconomicCalendarView`). Poll 3s + cache-buster cũ là nguyên nhân chính gây ~864K invocations/tháng.

### GET /api/article?url=...
- Fetches arbitrary article URL (9s timeout, 900KB HTML cap).
- Rejects `news.google.com` (host check) with error `GOOGLE_NEWS`.
- Strips script/style/nav/footer/etc.; extracts og:title/description/image/site_name + `<p>` paragraphs (max 120, each >22 chars).
- Returns `{ok, url, fetchedAt, source, title, description, image, paragraphs}`.
- `Cache-Control: public, max-age=60, s-maxage=600`.
- **SSRF**: fetch qua `safeFetch` (src/utils/safeFetch.js) — chặn IP riêng tư / loopback / 169.254.169.254 (metadata), chỉ http/https public, theo dõi redirect thủ công và kiểm tra lại từng hop.

### CRUD /api/user-feeds
- Backed by `user_feeds` table via service-role client.
- **GET** → list (`id,name,rss_url,category,enabled,last_error,last_fetched_at,created_at`) — mở cho anon (đọc).
- **POST ?action=test** → validate RSS/Atom (checks XML signature) + preview up to 6 items — mở cho anon (SSRF-guarded).
- **POST** → add feed, `upsert` on conflict `rss_url` (dedup) — **mở (không cần secret)**; yêu cầu đúng http/https, `validateFeed` qua `safeFetch` (SSRF-guarded).
- **PATCH/PUT** → update `name/category/enabled/rss_url` (validates URL if changed) — **mở**, SSRF-guarded.
- **DELETE** → remove feed — **mở**.
- all non-200 → `{ok:false,error}`.

### GET /api/sources
- Builds static source list: `DIRECT_RSS_FEEDS` + `EXTRA_FEEDS` + Google News aggregator + user_feeds (first 60).
- Checks health of each feed URL via `safeFetch` (SSRF-guarded, 5s timeout each, 5-min health cache); computes 24h article counts from `market_news` (1-min counts cache, limit 3000 rows).
- Returns `{ok, fetchedAt, sources: [{source,url,categories,healthy,error,count24h,userFeedId,enabled}]}` sorted by `count24h` desc.
- `Cache-Control: public, max-age=60, s-maxage=120`.

### POST /api/manual-fetch
- Trigger bên ngoài (admin curl). **Nút "Làm mới" trong app gọi `GET /api/scrape` (on-demand)** — không gọi endpoint này; nút chỉ tải lại list từ Supabase sau khi chờ scrape.
- Rate limit: 1 per 60s (`429`).
- **Yêu cầu `CRON_SECRET`** (fail-closed).
- Full pipeline: `scrapeAll()` + all user feeds → spam filter → title-dedupe → upsert → force purge spam → force cleanup old (>100 rows) → reclassify Paywall→Macro.
- Returns `{ok, scraped, user_feeds, spam_filtered, duplicate_filtered, upserted, junk_deleted, message}`.

### GET /api/scrape
- **Cào on-demand** — endpoint duy nhất app gọi để kéo tin mới: `App.js` trigger fire-and-forget khi **app mở** và trong `reloadAll` khi **bấm nút Làm mới / pull-to-refresh** (`SourceService.triggerOnDemandScrape`, timeout 15s).
- **Không cần secret.** Bảo vệ là cooldown **180s toàn cục** qua tier `on-demand` trong `cronState` (lock slot 14): mọi request trong cửa sổ đó trả `status: "skipped"` ngay. Client hiển thị toast theo `status` (`ok` → số tin mới, `skipped` → "vừa được cập nhật trước đó").
- Gọi `runCronFetch('on-demand')`: **toàn bộ feed** (system + user feeds) + cleanup/reclassify (cooldown nội bộ từng bước: junk 1h, cleanup 6h, reclassify 10p).
- CORS `*`, `Cache-Control: no-store` (client không được cache — nếu cache thì nút Làm mới sẽ không chạm origin). HTTP 500 khi `status: "error"`.

### GET /api/cron-fetch?tier=hot|standard|full
- **Chạy tay/admin bằng curl** — không còn scheduler nào gọi endpoint này (on-demand qua `/api/scrape`).
- Tiers: `hot` (5 hot Google queries + hot RSS feeds), `standard` (everything non-hot + user feeds), `full` (everything + maintenance + user feeds). **Tier `hot` bỏ qua user feeds** (tối đa 60 nguồn) — chỉ crawl ở `standard`/`full`.
- **Yêu cầu `CRON_SECRET`** (fail-closed, constant-time). Nguồn: header `x-cron-secret`, `Authorization: Bearer`, hoặc query `?secret=`.
- Locks via `cron_state` table (`cronAcquireLock`): hot 60s, standard 5m, full 4h, on-demand 180s.
- On `full`/`on-demand` tiers additionally: purge spam (non-forced, 1h cooldown), cleanup old news, reclassify Paywall→Macro.
- Sends FCM notifications for brand-new `is_important` rows (`notifyImportantNews`).
- Returns full stats payload (`status`: `ok`/`skipped`/`error`; HTTP 500 khi `error`).

### GET|POST /api/cleanup
- Manual spam purge. **Yêu cầu `CRON_SECRET`** (header `x-cron-secret` / Bearer / `?secret=`; so sánh constant-time). Auto-limit 500 rows (max 2000), non-forced cooldown 1h.

### GET /api/rss-proxy?url=...
- Generic RSS→JSON (max 15 items) using `fast-xml-parser`. Used for preview/testing. No category, hardcoded source `Google News`. `NOT REFERENCED` in mobile app — only via user feeds testing? `NOT FOUND` in current view code — see Services note.
- **SSRF**: fetch qua `safeFetch` — chặn IP riêng tư/metadata.

## Database (Supabase/Postgres)

### market_news
| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | md5/sha256 of normalized URL (`hashUrl`) |
| `title` | text | Original (EN) title |
| `title_vi` | text? | **NOT IMPLEMENTED** in backend pipeline — see below |
| `source` | text | e.g. "Yahoo Finance", "CNBC", "Google News", "Federal Reserve" |
| `url` | text | Source URL |
| `category` | text | Macro / XAUUSD / Forex / Crypto / Geopolitics / Paywall / Custom |
| `is_important` | boolean | RED_ALERT keyword match |
| `published_at` | timestamptz | Feed publish time |
| `created_at` | timestamptz | Insert time |

**`title_vi` note:** `.sql` files `add_title_vi.sql` / `drop_title_vi.sql` define/drop a `title_vi` column, but the scraper/upsert pipeline does **NOT** populate it (upsertNews only sets title/source/url/category/is_important/published_at). Translation is done client-side by TranslationService. `REQUIRES RUNTIME VERIFICATION`: whether `title_vi` column still exists in DB and is unused.

### user_feeds
| Column | Notes |
|---|---|
| `id` | PK (uuid) |
| `name` | Display name |
| `rss_url` | Unique — conflict target for upsert |
| `category` | Default 'Custom' |
| `enabled` | bool (nullable defaults true) |
| `last_error` | Last fetch error (240 chars) |
| `last_fetched_at` | Timestamp |

RLS: bật cho mọi role; chỉ có policy SELECT cho anon; `revoke insert, update, delete ... from anon, authenticated` (db/add_user_feeds.sql). Ghi chỉ qua backend (service role, đã có auth).

### cron_state
| Column | Notes |
|---|---|
| `id` | int PK (lock slot: 11=hot, 12=standard, 13=full, 14=on-demand) |
| `ran_at` | Last run — used for lock acquire condition |

## Scraper Pipeline (src/services/scraper.js)

- **Tier selection:**
  - `hot`: `HOT_GOOGLE_QUERIES` (5) + `HOT_DIRECT_RSS_FEEDS` (Yahoo, CNBC).
  - `standard`: everything except hot feeds.
  - `full`: all.
  - `on-demand`: all (không khớp hot/standard → trả toàn bộ feed).
- **Source lists (constants.js):**
  - `FED_MACRO_QUERIES` — 8 Google News query strings (category Macro).
  - `GEOPOLITICS_QUERIES` — 6 queries.
  - `GOLD_OIL_QUERIES` — 3 queries.
  - `FOREX_QUERIES` — 4 queries.
  - `CRYPTO_QUERIES` — **empty** (crypto disabled).
  - `PAYWALL_QUERIES` — `site:bloomberg.com markets` / `site:wsj.com markets finance` / `site:reuters.com markets`.
  - `DIRECT_RSS_FEEDS` — Yahoo, CNBC, MarketWatch (dowjones), OilPrice.
  - `EXTRA_FEEDS` — White House (via Google News site search) + 12 Federal Reserve feeds (maxAgeHours 168) + ForexFactory (hot) + Investing.com (hot).
- **Per-feed:** `fetchFeed(url)` with 3 retries on 4xx/429/timeout (600ms * attempt), XML parse via fast-xml-parser (RSS/RDF/Atom), max 20 items/feed. Mọi fetch đi qua `safeFetch` (SSRF guard + redirect thủ công).
- **Filtering:** `filterFresh(items, maxAgeHours=24)` → reject future/too-old; `isJunkItem` (spam regex) → drop; `dedupe` by `id` (URL hash).
- **`isRedAlert(title)`**: title contains any `RED_ALERT_KEYWORDS` (FED, FOMC, CPI, PPI, NFP, XAUUSD, GOLD, OIL, WAR, MISSILE, NUCLEAR, RECESSION, TARIFF...) → `is_important`.
- **`hashUrl`**: SHA-256 of normalized URL (base64url) — note the **server hashes `google|${url}`** in `fetchFeedOnce` (id = sha256(`google|${url}`)) but `hashUrl` in helpers otherwise hashes plain URL. The `google|` prefix is only applied in scraper items from Google News. This means Google News items and direct items for the same URL **do not collide** in dedup. `REQUIRES RUNTIME VERIFICATION` for cross-feed dedup effectiveness.

## Spam/Duplicate Filtering (utils/spamFilter.js)
- `SPAM_REGEX`: 17 regexes (gainers/losers clickbait, hyped crypto-topics, "top 10 ways", markets-forecast junk, casino/betting, promo).
- `CRYPTO_REGEX`: bitcoin/ethereum/etc. → blocked entirely.
- `isJunkTitle`: too-short (<16 chars), spam, crypto, ALL-CAPS (>60% uppercase over 40 chars).
- `buildTitleSelection(items)`: dedupe by `titleKey` (lowercase alnum-only). Keeps preferred: important > non-Google source > newer.

## Scrape On-demand (không còn cron ở bất kỳ đâu)
- `backend/vercel.json` để `"crons": []` — **không đăng ký cron nào trên Vercel** (Hobby Fluid Active CPU 4h/tháng; crawler nền sẽ hết quota). Không có GitHub Actions scheduler, không có cron-job.org.
- Kích hoạt duy nhất — `GET /api/scrape` (tier `on-demand`):
  - **App mở**: `App.js` fire-and-forget `triggerOnDemandScrape()` cùng lúc `vm.start()` — tin mới tự đến qua Realtime, không block splash.
  - **Nút Làm mới / pull-to-refresh**: `reloadAll` chờ scrape xong rồi `vm.refresh()`, toast theo `status` (`ok` → số tin mới, `skipped` → "vừa được cập nhật trước đó").
- **Cooldown 180s toàn cục** (`TIER_CONFIG['on-demand'].lockSeconds`, lock slot 14): request trong cửa sổ trả `status: "skipped"` không chạy pipeline — đây là lớp chống abuse duy nhất (endpoint mở, không secret).
- **Dọn scheduler cũ**: disable/delete mọi job cron-job.org đang GET `/api/cron-fetch?tier=...`; (tuỳ chọn) xóa cron `0 1 * * *` trong Vercel Dashboard → Cron Jobs.
- Chạy tay bằng curl vẫn dùng `GET /api/cron-fetch?tier=...` (yêu cầu `CRON_SECRET`).

## Push Notifications (services/fcm.js)
- FCM V1 via service account JWT (RS256) → OAuth token → `POST /fcm.googleapis.com/v1/projects/{id}/messages:send`.
- Falls back to `FCM_SERVER_KEY` (legacy) if JWT creds missing.
- Sends on topic `FCM_TOPIC` (default `market_alerts`), message contains Android (channel) + webpush + data payload.
- `notifyImportantNews(items)` → sends for each `is_important` brand-new item.
- `click_action: 'FLUTTER_NOTIFICATION_CLICK'` — legacy Flutter hint, `REQUIRES RUNTIME VERIFICATION` whether it does anything for the RN app.