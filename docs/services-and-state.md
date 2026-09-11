# Services, State Management & Storage

## NewsViewModel (mobile/src/viewmodels/NewsViewModel.js)

Central state owner for the news feed. Class instance created once in `App.js` via `viewModelRef` (persists across renders, single instance per app lifetime).

### Public API
| Method | Purpose |
|---|---|
| `subscribe(listener)` | Push listener receiving `{items, loading, error}` on each `emit()`. Returns unsubscribe. |
| `onNewItem(listener)` | Register callback for realtime-inserted fresh items. Returns unsubscribe. |
| `start()` | `initialLoad()` → set up Realtime subscribe + 5-min poll timer. |
| `stop()` | Tear down Realtime channel + clear interval. |
| `refresh()` | Fetch latest 100 from Supabase, update cache, emit. |
| `initialLoad()` | Load cache first → emit → fetch → emit; errors kept in `this.error` preferred over throwing. |

### Realtime Behavior (start())
- Subscribes to Supabase channel `market-news-realtime` for `postgres_changes` on `market_news`: **INSERT**, **UPDATE**, **DELETE**.
- `onInsert(item)`:
  - Ignores duplicates (`knownIds` Set; dedup by `item.id`).
  - Computes `isFresh = ageMs >= 0 && ageMs <= NEW_ITEM_MAX_AGE_MS` (6 hours).
  - Prepend + resort by `publishedAt` desc, cap at 150 items.
  - If fresh AND `isImportant` → `NewsWarningService.playBeep()` + `scheduleLocal(item)` (native only).
  - Emits to `newItemListeners` (→ NotificationToast in App.js).
  - Always `emit()`.
- `onDelete` → triggers `refresh()`.
- `onUpdate(updated)` → replaces item in list, updates important set, emits.

### Data Model (NewsModel, mobile/src/models/NewsModel.js)
Fields: `id`, `title` (raw EN), `titleVi` (nullable EN→VI cached translation), `source`, `url` (normalized), `category`, `isImportant` (bool), `publishedAt` (Date), `createdAt` (Date).

Constructors: `fromSupabase(row)` (DB row), `fromCustomFeed({title,url,source,publishedAt,category='Custom'})` → id `custom_${url}`.

## Event/Communication Channels

| Mechanism | How |
|---|---|
| ViewModel state | `subscribe()` → `{items, loading, error}` pushed to App.js `setState` |
| New-item toast | `onNewItem()` → NotificationToast |
| Toast (general) | `ToastService` singleton with `subscribeToasts()` → `ToastHost` |

## ToastService.js
Global, module-scoped listener list + incrementing `seq`.

| API | Signature |
|---|---|
| `showToast({type,title,message,duration=4500,badge,actions})` | Creates toast, notifies, auto-dismisses after duration |
| `dismissToast(id)` | Notifies listeners with `{id, dismiss:true}` |
| `ToastService` | `{ showToast, dismissToast }` convenience export |

Toast shape: `{id, type, title, message, badge, actions}`. `message` newlines → bullets in ToastHost.

## SourceService.js
Backend REST client for sources + user feeds.

| Function | Endpoint | Method |
|---|---|---|
| `fetchSources()` | `${BACKEND_URL}/api/sources` | GET (20s timeout) |
| `triggerManualFetch()` | `${BACKEND_URL}/api/manual-fetch` | POST (90s timeout) |
| `addUserFeed({name, rssUrl, category})` | `${BACKEND_URL}/api/user-feeds` | POST (20s) |
| `updateUserFeed(id, {name,rssUrl,category,enabled})` | `${BACKEND_URL}/api/user-feeds?id=` | PATCH (20s) |
| `testUserFeed(rssUrl)` | `${BACKEND_URL}/api/user-feeds?action=test` | POST (25s) |
| `removeUserFeed(id)` | `${BACKEND_URL}/api/user-feeds?id=` | DELETE (15s) |
| `sourcesFromItems(items)` | (client-side) | Builds source map + `count24h` from feed items |

All use `AbortSignal.timeout(...)`; errors thrown as `new Error(json.error || HTTP n)`.

## SupabaseService.js
Direct client to Supabase for news feed (bypasses backend for read/realtime).

- `getSupabase()`: lazy `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {realtime:{params:{eventsPerSecond:2}}})`.
- `fetchLatestNews(limit=100)`: `from('market_news').select('*').order('published_at', desc).limit(limit)` → map to `NewsModel`.
- `subscribeRealtime(onInsert, onDelete, onUpdate)`: channel `market-news-realtime`, postgres_changes on `market_news` INSERT/UPDATE/DELETE.
- Returns `() => supabase.removeChannel(channel)`.

Security note: uses **anon key** client-side (public). RLS restricted accordingly — see `db/realtime_rls.sql`. `REQUIRES RUNTIME VERIFICATION`: confirm RLS grants anon SELECT.

## TranslationService.js
English→Vietnamese title translation with cache (30-day TTL, max 500).

- Endpoint: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=...` (Google Translate GTX unofficial).
- Caching: localStorage/AsyncStorage at key `@aster/translations` as array of `[en, vi, timestamp]`.
- Rate limiting: max 4 concurrent, max 40 queue (drops beyond queue → returns original).
- Skips non-translatable (too short/without ASCII letters, >500 chars).
- Returns original text on any failure.

## ReaderService.js
Fetches readable article by URL.

`fetchArticle(targetUrl)`:
- `normalizeUrl(url)` → HTTPS prefix if missing.
- Candidate order: **same-origin first** (`window.location.origin/api/article?url=`) when on web; then `${BACKEND_URL}/api/article?url=`.
- 15s timeout each, returns first success that returns `json.ok`, else throws last error.

## NewsWarningService.js
Breaking-news alerting.

| API | Behavior |
|---|---|
| `playBeep()` | Web: plays 3-note chime (E5→B5→E6, lowpass filtered) via Web Audio API. Native: (imports expo-notifications only to ensure handler configured; does not actually schedule) `UNKNOWN` effectiveness |
| `scheduleLocal(newsItem)` | Native only (web returns early). Requests notification permission, schedules local notification for important items. Android uses channel `market_alerts` + sound `chime-soft.wav`. iOS: trigger null (immediate). |
| Mobile beep | On web only; native uses local notifications — actual beep for immediate `isImportant` items is web-only trick. |

`NOT IMPLEMENTED` on the client for FCM push: push notifications are sent from the backend; the client just receives local ones. Client has no FCM SDK.

## LocalStorageService.js
Unified local storage wrapper — localStorage on web, AsyncStorage on native. All keys:
| Key | Purpose |
|---|---|
| `@aster/custom_feeds` | Custom RSS feeds saved locally (legacy client-side custom feeds) |
| `@aster/last_read_at` | Last-marked-read timestamp |
| `@aster/watch_keywords` | Watchlist keywords array |
| `@aster/bookmarks` | Bookmarked items array (full item objects) |
| `@aster/news_cache` | `{savedAt, items[]}` — cached news, TTL **3h**, max **100** items |
| `@aster/translations` | Translation cache (uses TranslationService directly, same prefix) |

**Legacy `@aster/custom_feeds`:** `addCustomFeed`/`removeCustomFeed`/`clearCustomFeeds` exist but **NOT FOUND** references in views/app component (SourcesView uses backend user feeds instead). Marked legacy/dead code path. `NOT USED`.

## Hooks
| Hook | File | Purpose |
|---|---|---|
| `useOnlineStatus()` | src/hooks/useOnlineStatus.js | Global online/offline for web + `justReturned` |
| `useSwipeDismiss({onDismiss})` | src/hooks/useSwipeDismiss.js | Toast swipe-to-dismiss |

## Utils
| File | Purpose |
|---|---|
| `src/utils/url.js` | `normalizeUrl(url)` — add https:// if missing |
| `src/utils/time_format.js` | `formatRelativeTime(date)` — relative time strings |
| `src/utils/domain.js` | `faviconUrl(source, url)` — generate Google favicon service URL (used in SourcesView) |
| `src/utils/calendarVi.js` | `localizeTitle`, `localizeCountry`, `formatDateHeader`, `formatTime` (Vietnamese localization) |
| `src/utils/webPwa.js` | PWA wiring helpers (see pwa-and-build.md) |