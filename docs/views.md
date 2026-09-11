# View Inventory (Screens)

Location: `mobile/src/views/`

## AppHeader.js
Top app bar shown on all tabs except GOLD.

**Props:** `online` (bool from `useOnlineStatus`), `loading` (bool), `onRefresh` (callback → `reloadAll`).

**Renders:**
- `PulseLogo size=22`
- `LiveDot` + status label: `● Trực tiếp` (green) when online / `○ Ngoại tuyến` (red) when offline
- Web build version badge (`window.__ASTER_BUILD`, e.g. `v11`) via `getBuildVersion()`
- Refresh button with spinning icon while loading (Animated 900ms loop)

**Background:** `rgba(11,20,38,0.82)` with `backdropFilter: blur(14px)`, bordered by `rgba(148,163,184,0.10)`, `zIndex:50`. Width capped at 896px centered.

## NewsListView.js
Main news feed ("Tin nóng"). Full-width FlatList.

**Props:** `items` (NewsModel[]), `loading`, `error`, `onItemPress`, `onRefresh`.

**Features:**
- **Category chips**: dynamic by item categories, sorted by count (All first). Uses `categoryStyle(category).label`.
- **Search**: filters by title/source (case-insensitive substring).
- **Skeleton loading**: 4 shimmer cards (Animated 1400ms loop) when `loading && items.length === 0`.
- **Pull-to-refresh**: RefreshControl (tint `COLORS.primary`).
- **Item entrance animation**: stagger fade+slide per index (delay = min(index*50, 600)).
- **Error state**: full-screen "Không kết nối được dữ liệu" + Thử lại.
- **Empty state**: "Chưa có tin tức" + Làm mới.

## NewsCard.js
Single news item card. Memoized with `memo`.

**Props:** `item` (NewsModel), `onPress(item)`, `dimmed` (optional, opacity 0.55).

**Renders:**
- Category dot + short label (e.g., "Vĩ mô", "Vàng") colored by `categoryStyle`
- "NÓNG" badge (red) + red dot when `item.isImportant`
- Title via `TranslatedText` (async EN→VI, 3 lines)
- Source monogram (2-letter initial), source name, relative time (`formatRelativeTime`)

## NewsArticleView.js
In-app article reader (opened from the news modal).

**Props:** `item`, `onOpenOriginal`, `onToggleBookmark`, `isBookmarked`.

**States:**
- `loading` → spinner "Đang đọc nội dung..."
- `ready` → hero image (og:image), category chip, source, translated title, description, paragraphs
- Google News special case → "Tin tổng hợp từ Google News" + open original button
- `error`/empty paragraphs → "Trang không cho đọc nhúng" + open original

**Data source:** `fetchArticle(item.url)` from ReaderService → `/api/article?url=...`. Fetches same-origin first (`window.location.origin/api/article`), falls back to `BACKEND_URL`.

**Note:** "↗ Mở tab" button in the modal header calls `openInNewTab(url)` on web (anchor with `target=_blank rel=noopener noreferrer`).

## NewsWebView.js
Full embedded web view (native only via react-native-webview). On web renders an `<iframe>`.

**Props:** `url`, `onClose` (`onClose` prop declared but not referenced in current render — `NOT USED`).

Used for "↗ Mở tab" / "open original" on native inside the article modal when `embedArticle` is true in App.js.

## NotificationToast.js
Transient "new article" toast (top of screen), auto-dismissed after 7s, swipe-dismissable.

**Props:** `item`, `onPress`, `onClose`, `offset`.

**Renders:** bolt icon in squircle, red "TIN MỚI" label, translated title (2 lines), "Đọc ngay" (primary) → opens article + goes to NEWS tab, "Để sau" (ghost) → dismiss.

Position: absolute top, `top: 10 + offset*140`, max 3 stacked, `zIndex:1000`.

## WatchlistView.js
"Quan tâm" tab. Keyword-based filter + bookmarks.

**Props:** `items`, `keywords`, `onAddKeyword`, `onRemoveKeyword`, `bookmarks`, `onToggleBookmark`, `onOpenArticle`.

**Features:**
- Keyword input with "Thêm" button (uses lucide `Sparkles`/`Search` icons; note: **imports `Search` from `lucide-react-native`** — this is one of the only lucide usages in the app)
- Suggestion chips: `FED`, `Lãi suất`, `XAUUSD`, `Dầu thô`
- Active keyword chips (tap to remove)
- "TIN KHỚP TỪ KHÓA (n)" section — items matching any keyword (title or source substring, dedup by id, max 40)
- "ĐÃ LƯU (n)" section — bookmarked items with "Bỏ lưu" button

## EconomicCalendarView.js
"Lịch KT" tab. Economic calendar (fixture calendar, no price ticker).

**Props:** (none — self-contained; but relies on global body device width via `useWindowDimensions`).

**Features:**
- **Related chips**: "Tin ảnh hưởng · Vàng/Bạc · CPI · Fed" — fetches latest 60 news, filters by RELATED_TERM_RE / RELATED_JUNK_RE, links out via `Linking.openURL`
- **Impact filters**: All / High / Medium / Low with per-filter active colors
- **Auto-focus**: scrolls to today's group on mount (`scrollIntoView` — web only, guarded by `typeof document`)
- **"Hôm nay" FAB**: shows when scrolled > 240px away from today's group
- **1s ticker**: countdown timer for upcoming events
- **Countdown chip**: shows while in 5-min window before slot; spinning refresh icon while waiting after slot (≤4h window)
- **Real-time polls**: every 30s refetches events (`loadEvents('poll')`); 12s fetch timeout with AbortController; 15s hang-rescue toast
- **Backend source**: `BACKEND_URL/api/calendar`

**Localization:** `localizeTitle()`, `localizeCountry()`, `formatDateHeader()`, `formatTime()` from `utils/calendarVi.js`.

## TradingViewScreen.js
"Vàng XAU" tab. Embedded TradingView widget.

**Props:** `onRequestChartTouch` (fires on any touch → hides the TabBar for immersive fullscreen chart).

**Renders:**
- Web: `<iframe>` with `buildTradingViewUrl()` params (symbol OANDA:XAUUSD, interval 60, theme dark, timezone `Asia/Ho_Chi_Minh`, locale `vi`, full toolbar)
- Native: (no iframe on native — renders placeholder only; chart not available natively) `NOT IMPLEMENTED` for native
- **`online` aware**: iframe only rendered when `online && Platform.OS === 'web'`; offline shows "Ngoại tuyến — không hiển thị giá cũ" 
- FAB: reload button label "Trực tiếp"/"Ngoại tuyến" based on `online`
- `onError` → failed state "Không tải được biểu đồ — bấm Trực tiếp để thử lại"

**Implied:** XAUUSD chart is web-only via iframe. `REQUIRES RUNTIME VERIFICATION`: TradingView embed URL (`s.tradingview.com/widgetembed/?symbol=OANDA:XAUUSD&interval=60&theme=dark...`) is unverified beyond the source string.

## SourcesView.js
"Nguồn tin" tab. Source registry + user feed CRUD.

**Props:** `items` (for fallback `sourcesFromItems()` when backend fetch fails — shows local-only source list), `onOpenArticle`.

**Features:**
- Fetches `/api/sources` → list of sources with health dot + "Lỗi" label + `count24h` badge
- `status === 'offline'` → falls back to deriving sources from `items` via `sourcesFromItems()` with an offline banner ("Không tải được backend — hiển thị dữ liệu cục bộ")
- Source detail view: tap a source → its recent posts (posts matching `item.source === source.source`) + URL + "Sao chép" (clipboard)
- "Thêm nguồn tin của bạn" → modal form: Name, RSS URL (with "Cào thử" → `testUserFeed` → validates and previews up to 3 sample items), Category picker (Custom/Macro/XAUUSD/Forex/Crypto/Geopolitics)
- Edit/delete for user-created feeds (userFeedId present)
- **Toggle switch** to pause/resume user feeds

**OAuth/Account:** sources shared globally across all clients — no per-user auth. `REQUIRES RUNTIME VERIFICATION`: user feeds are a single shared global list (no user scoping).