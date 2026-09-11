# Backend & Data Layer

All endpoints are Vercel serverless functions (ESM). Runtime Node ≥18 with `fetch`.

## Environment (backend)

| Var | Used For |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-side, full access) |
| `CRON_SECRET` | Bearer/query secret for cron + cleanup endpoints |
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

### GET /api/calendar
- Proxies `https://nfs.faireconomy.media/ff_calendar_thisweek.json`.
- Filters impacts (`High`/`Medium`/`Low`), maps to `{title,country,date,impact,forecast,previous,actual,unit}`, sorts ascending by date.
- In-memory cache 5 min. `stale:true` fallback; `502` if no cache.
- `Cache-Control: public, max-age=300`.

### GET /api/article?url=...
- Fetches arbitrary article URL (9s AbortController, 900KB HTML cap).
- Rejects `news.google.com` (host check) with error `GOOGLE_NEWS`.
- Strips script/style/nav/footer/etc.; extracts og:title/description/image/site_name + `<p>` paragraphs (max 120, each >22 chars).
- Returns `{ok, url, fetchedAt, source, title, description, image, paragraphs}`.
- `Cache-Control: public, max-age=60, s-maxage=600`.
- **Security:** open SSRF proxy — fetches any `http(s)` URL. `REQUIRES RUNTIME VERIFICATION` for access control.

### CRUD /api/user-feeds
- Backed by `user_feeds` table via service-role client.
- **GET** → list (`id,name,rss_url,category,enabled,last_error,last_fetched_at,created_at`).
- **POST ?action=test** → validate RSS/Atom (checks XML signature) + preview up to 6 items.
- **POST** → add feed, `upsert` on conflict `rss_url` (dedup).
- **PATCH/PUT** → update `name/category/enabled/rss_url` (validates URL if changed).
- **DELETE** → remove feed.
- all non-200 → `{ok:false,error}`.

### GET /api/sources
- Builds static source list: `DIRECT_RSS_FEEDS` + `EXTRA_FEEDS` + Google News aggregator + user_feeds (first 60).
- Checks health of each feed URL (5s timeout each, 5-min health cache); computes 24h article counts from `market_news` (1-min counts cache, limit 3000 rows).
- Returns `{ok, fetchedAt, sources: [{source,url,categories,healthy,error,count24h,userFeedId,enabled}]}` sorted by `count24h` desc.
- `Cache-Control: public, max-age=60, s-maxage=120`.

### POST /api/manual-fetch
- Manual trigger from Refresh button. Rate limit: 1 per 60s (`429`).
- Full pipeline: `scrapeAll()` + all user feeds → spam filter → title-dedupe → upsert → force purge spam → force cleanup old (>100 rows) → reclassify Paywall→Macro.
- Returns `{ok, scraped, user_feeds, spam_filtered, duplicate_filtered, upserted, junk_deleted, message}`.

### GET /api/cron-fetch?tier=hot|standard|full
- Cron-driven fetch. Tiers: `hot` (5 hot Google queries + 2 hot RSS feeds), `standard` (everything non-hot), `full` (everything + maintenance).
- Optional auth: `Authorization: Bearer ${CRON_SECRET}` (if env set).
- Locks via `cron_state` table (`cronAcquireLock`): hot 60s, standard 5m, full 4h.
- On full tier additionally: purge spam (non-forced, 1h cooldown), cleanup old news, reclassify Paywall→Macro.
- Sends FCM notifications for brand-new `is_important` rows (`notifyImportantNews`).
- Returns full stats payload.

### GET|POST /api/cleanup
- Manual spam purge with `?key=secret` or Bearer. Auto-limit 500 rows (max 2000), non-forced cooldown 1h.

### GET /api/rss-proxy?url=...
- Generic RSS→JSON (max 15 items) using `fast-xml-parser`. Used for preview/testing. No category, hardcoded source `Google News`. `NOT REFERENCED` in mobile app — only via user feeds testing? `NOT FOUND` in current view code — see Services note.

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

### cron_state
| Column | Notes |
|---|---|
| `id` | int PK (lock slot: 11=hot, 12=standard, 13=full) |
| `ran_at` | Last run — used for lock acquire condition |

## Scraper Pipeline (src/services/scraper.js)

- **Tier selection:**
  - `hot`: `HOT_GOOGLE_QUERIES` (5) + `HOT_DIRECT_RSS_FEEDS` (Yahoo, CNBC).
  - `standard`: everything except hot feeds.
  - `full`: all.
- **Source lists (constants.js):**
  - `FED_MACRO_QUERIES` — 8 Google News query strings (category Macro).
  - `GEOPOLITICS_QUERIES` — 6 queries.
  - `GOLD_OIL_QUERIES` — 3 queries.
  - `FOREX_QUERIES` — 4 queries.
  - `CRYPTO_QUERIES` — **empty** (crypto disabled).
  - `PAYWALL_QUERIES` — `site:bloomberg.com markets` / `site:wsj.com markets finance` / `site:reuters.com markets`.
  - `DIRECT_RSS_FEEDS` — Yahoo, CNBC, MarketWatch (dowjones), OilPrice.
  - `EXTRA_FEEDS` — White House (via Google News site search) + 12 Federal Reserve feeds (maxAgeHours 168) + ForexFactory (hot) + Investing.com (hot).
- **Per-feed:** `fetchFeed(url)` with 3 retries on 4xx/429/timeout (600ms * attempt), XML parse via fast-xml-parser (RSS/RDF/Atom), max 20 items/feed.
- **Filtering:** `filterFresh(items, maxAgeHours=24)` → reject future/too-old; `isJunkItem` (spam regex) → drop; `dedupe` by `id` (URL hash).
- **`isRedAlert(title)`**: title contains any `RED_ALERT_KEYWORDS` (FED, FOMC, CPI, PPI, NFP, XAUUSD, GOLD, OIL, WAR, MISSILE, NUCLEAR, RECESSION, TARIFF...) → `is_important`.
- **`hashUrl`**: SHA-256 of normalized URL (base64url) — note the **server hashes `google|${url}`** in `fetchFeedOnce` (id = sha256(`google|${url}`)) but `hashUrl` in helpers otherwise hashes plain URL. The `google|` prefix is only applied in scraper items from Google News. This means Google News items and direct items for the same URL **do not collide** in dedup. `REQUIRES RUNTIME VERIFICATION` for cross-feed dedup effectiveness.

## Spam/Duplicate Filtering (utils/spamFilter.js)
- `SPAM_REGEX`: 17 regexes (gainers/losers clickbait, hyped crypto-topics, "top 10 ways", markets-forecast junk, casino/betting, promo).
- `CRYPTO_REGEX`: bitcoin/ethereum/etc. → blocked entirely.
- `isJunkTitle`: too-short (<16 chars), spam, crypto, ALL-CAPS (>60% uppercase over 40 chars).
- `buildTitleSelection(items)`: dedupe by `titleKey` (lowercase alnum-only). Keeps preferred: important > non-Google source > newer.

## Cron (backend/vercel.json)
| Cron | Endpoint |
|---|---|
| `0 1 * * *` | `/api/cron-fetch?tier=full` |

**Only one cron registered** — a daily full-tier run at 01:00. No hot/standard crons are scheduled. `REQUIRES RUNTIME VERIFICATION`: with only a daily full cron, the feed only refreshes once/day unless a manual fetch or user-triggered fetch happens; realtime push (INSERT) keeps the client feeling live within that window.

## Push Notifications (services/fcm.js)
- FCM V1 via service account JWT (RS256) → OAuth token → `POST /fcm.googleapis.com/v1/projects/{id}/messages:send`.
- Falls back to `FCM_SERVER_KEY` (legacy) if JWT creds missing.
- Sends on topic `FCM_TOPIC` (default `market_alerts`), message contains Android (channel) + webpush + data payload.
- `notifyImportantNews(items)` → sends for each `is_important` brand-new item.
- `click_action: 'FLUTTER_NOTIFICATION_CLICK'` — legacy Flutter hint, `REQUIRES RUNTIME VERIFICATION` whether it does anything for the RN app.