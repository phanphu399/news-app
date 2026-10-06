# ASTER — Realtime Forex & Macro News App

Monorepo chứa **Serverless Backend (Vercel, cào tin on-demand)** + **Mobile App (Expo / React Native)** cho ứng dụng tin tức Forex & Macro theo thời gian thực. Toàn bộ commit ở nhánh `main` được tự động deploy bởi Vercel.

---

## 1. Tổng quan (System Overview)

- **Backend** (`backend/`): Vercel Serverless Functions phục vụ API theo yêu cầu; **cào tin on-demand** — chỉ chạy khi người dùng mở app hoặc bấm Làm mới (`GET /api/scrape`, cooldown 180s toàn cục), ghi vào Supabase và bắn push notification qua FCM. **Không có cron nào** (Vercel lẫn bên ngoài).
- **Mobile** (`mobile/`): Ứng dụng Expo (React Native) theo **Clean Architecture**, tách biệt UI Views (dumb) và ViewModels (smart), nhận dữ liệu tức thì bằng **Supabase Realtime**.

```
news-app/
│
├── .github/workflows/
│   └── ci.yml                    # Pipeline CI tự động kiểm tra backend + mobile
│
├── backend/                     # [VERCEL SERVERLESS PROJECT]
│   ├── api/scrape.js            # Cào on-demand (app mở / nút Làm mới) — throttle 180s
│   ├── api/cron-fetch.js        # Endpoint chạy tay/admin theo tier (auth CRON_SECRET) — Controller
│   ├── src/
│   │   ├── config/constants.js  # Keywords đỏ, URL Google News, RSS feeds + tier hot
│   │   ├── services/
│   │   │   ├── scraper.js       # Cào RSS theo tier + parse XML (fast-xml-parser)
│   │   │   ├── cronPipeline.js  # Logic pipeline tier hot/standard/full/on-demand (dùng bởi 2 API trên)
│   │   │   ├── supabase.js      # Upsert, lock tier, dọn dữ liệu, realtime
│   │   │   └── fcm.js           # Firebase Cloud Messaging (HTTP v1)
│   │   └── utils/helpers.js     # Băm URL → ID, check tin đỏ, sanitize
│   ├── package.json
│   ├── vercel.json              # crons: [] — không có cron trên Vercel
│   └── .env.example
│
├── mobile/                      # [MOBILE APP — EXPO / REACT NATIVE]
│   ├── App.js                   # Entry: SafeArea + Tab navigation
│   ├── assets/                  # icon, splash, sounds/beep.wav (tiếng BEEP cảnh báo)
│   └── src/
│       ├── config/constants.js  # Supabase URL/Key, màu tin đỏ, TradingView embed
│       ├── models/NewsModel.js  # Data schema phía client
│       ├── views/               # NewsListView, NewsCard, NewsWebView, EconomicCalendarView, CustomFeedView
│       ├── viewmodels/NewsViewModel.js  # State: Realtime, trộn Custom Feeds
│       ├── services/            # SupabaseService, CustomFeedService (Local-First), NewsWarningService (BEEP)
│       └── utils/time_format.js # Hàm tính "Thời gian tương đối" theo giờ thiết bị
│
├── db/schema.sql                # Bảng market_news + trigger dọn rác 3 ngày + realtime
├── .gitignore
└── README.md                    # Master PRD này
```

---

## 2. Database & Storage (Supabase / PostgreSQL)

Bảng **`market_news`** — **tuyệt đối không lưu nội dung bài viết**:

| Column          | Type         | Mô tả                                                  |
|-----------------|--------------|--------------------------------------------------------|
| `id`            | `text` (PK)  | Base64url hash (SHA-256) của URL bài báo → chống trùng  |
| `title`         | `text`       | Tiêu đề tin                                            |
| `source`        | `text`       | Nguồn (Yahoo Finance, CNBC, White House, Google News)   |
| `url`           | `text`       | Link gốc (mở In-App WebView)                           |
| `category`      | `text`       | Macro / XAUUSD / Paywall / Geopolitics                 |
| `is_important`  | `boolean`    | Tin đỏ (FED, XAUUSD, War, CPI, ...)                    |
| `published_at`  | `timestamptz`| Thời gian xuất bản (UTC)                               |

- **Giữ 3 ngày**: Trigger `delete_old_market_news()` tự xóa bản ghi `published_at < NOW() - INTERVAL '3 days'` (xem `db/schema.sql`, chạy 1 lần trong Supabase SQL Editor).
- **Upsert**: dùng `upsert(..., { onConflict: 'id' })` — không tốn query read để check trùng.
- **Realtime**: `alter publication supabase_realtime add table public.market_news` cho phép mobile nhận tin tức tức thì.
- **Set env** trên Supabase/Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. Data Fetching Pipeline (On-demand)

> **Lưu ý quan trọng (Hobby plan):** Vercel Hobby chỉ gồm **4 giờ Fluid Active CPU/tháng**. Cào tin chạy nền dày đặc trên Serverless Function (cron mỗi phút, poll liên tục) sẽ dùng hết quota và **tự động pause toàn bộ Function**. Do đó **không có scheduler nào** — cào chỉ chạy **khi người dùng mở app hoặc bấm Làm mới**, với cooldown **180s toàn cục** → mỗi lượt cào tối đa ~48 lượt/giờ CPU.

`backend/vercel.json` để `"crons": []` — **không có cron nào chạy trên Vercel**.

Nguồn kích hoạt:

| Sự kiện | Tier | Nhịp | Ghi chú |
|---|---|---|---|
| Người dùng mở app | `on-demand` | mỗi lần mở, tự bỏ qua nếu <180s | fire-and-forget (`App.js`), tin mới tự đến qua Realtime |
| Nút Làm mới / pull-to-refresh | `on-demand` | mỗi lần bấm, tự bỏ qua nếu <180s | `GET /api/scrape` → `status: ok/skipped` → toast theo kết quả |
| Chạy tay bằng curl (admin) | `hot`/`standard`/`full` | tùy ý | `GET /api/cron-fetch?tier=...`, yêu cầu `CRON_SECRET` |

Pipeline nằm ở `src/services/cronPipeline.js` (service thuần, không phụ thuộc HTTP) — dùng chung bởi `api/scrape.js` (on-demand) và `api/cron-fetch.js` (admin):

1. **Scrape** (`services/scraper.js`):
   - **Google News Proxy** (`news.google.com/rss/search`): query theo tier — Vĩ mô (FED, CPI), Hàng hóa (XAUUSD, Oil), Geopolitics, Forex, Paywall (site:bloomberg.com, site:wsj.com, site:reuters.com).
   - **Direct RSS**: Yahoo Finance, CNBC, MarketWatch, OilPrice, Fed feeds... — parse bằng `fast-xml-parser`.
2. **Tagging**: tiêu đề chứa keyword đỏ (FED, FOMC, CPI, XAUUSD, WAR, ...) → `is_important = true`.
3. **Dedupe**: ID = hash URL; chỉ notify các tin quan trọng **mới** (chưa tồn tại trong DB) để tránh beep lặp mỗi phút.
4. **Push**: `services/fcm.js` gọi FCM **HTTP v1** (OAuth2 service account) với `sound: "default"` / file `beep.wav` để điện thoại **BEEP** cảnh báo kể cả khi khóa màn hình.
5. **Cleanup**: xóa bản ghi quá 3 ngày (tier `full` hoặc `on-demand` — đều có cooldown nội bộ).
6. **Tier `hot` bỏ qua user feeds**: tối đa 60 nguồn RSS cá nhân chỉ được crawl ở tier `standard`/`full` — giữ nhịp hot nhẹ và nhanh.

Bảo mật: `/api/scrape` là endpoint **mở** nhưng tự throttle 180s toàn cục (bảng `cron_state`) — chống spam bằng lock chứ không bằng secret. `/api/cron-fetch` vẫn yêu cầu `Authorization: Bearer <CRON_SECRET>` (fail-closed) cho chạy tay bằng curl.

---

## 4. Mobile App & UX

- **Relative Time**: Backend chỉ trả `published_at` UTC; `mobile/src/utils/time_format.js` tính theo giờ thiết bị → **"Vừa xong"**, **"5 phút trước"**, **"2 giờ trước"**.
- **UI tối giản**: List tin, tiêu đề to rõ. Tin `is_important` có **viền đỏ + chấm đỏ** (màu định nghĩa ở `src/config/constants.js`).
- **Push Notification FCM**: nguồn Runnable: khi Supabase Realtime nhận tin quan trọng → tự phát âm thanh `beep.wav` + local notification; ngoài ra backend FCM vẫn gửi từ xa.
- **In-App WebView**: bấm tin → mở bài gốc trong WebView (`NewsWebView.js`).
- **Tab Lịch kinh tế**: nhúng TradingView Economic Calendar (`EconomicCalendarView.js`).
- **Custom Feeds (Local-First)**: nguồn tin RSS cá nhân chỉ lưu trong `AsyncStorage` trên thiết bị — **không bao giờ gửi lên server**.

Nguyên tắc code:
- **Dumb Views — Smart ViewModels**: views chỉ render; mọi logic nằm ở `viewmodels/` và `services/`.
- Màu/kiểu của tin đỏ tách riêng ở constants, dễ thay đổi.
- Payload FCM tối giản: `title`, `url`, `sound`.

---

## 5. Setup

### Backend (Vercel)
```bash
cd backend
npm install
vercel --prod
```
Đặt env trên Vercel (xem `backend/.env.example`).

### Cào tin (On-demand — không còn scheduler nền)

Không có cron nào ở mọi nơi (Vercel, cron-job.org, GitHub Actions). Cào chỉ chạy khi người dùng **mở app** hoặc **bấm Làm mới** (`GET /api/scrape`), tự bỏ qua nếu lượt trước chưa qua **180s** (cooldown toàn cục trong bảng `cron_state`).

Các bước dọn scheduler cũ:

1. **Disable/delete toàn bộ job cron-job.org** đang GET `https://<app>.vercel.app/api/cron-fetch?tier=...` — đây là nguyên nhân chính đẩy CPU Vercel vượt quota.
2. (Tùy chọn) Xóa cron `0 1 * * *` trong **Vercel Dashboard → `news-app-realtime-seven` → Cron Jobs**.
3. Không cần secrets hay PAT nào cho GitHub — CI chỉ syntax-check, không chạy pipeline.

Chạy tay bằng curl (admin): `GET /api/cron-fetch?tier=hot|standard|full` với header `Authorization: Bearer <CRON_SECRET>`.

| Tier | Kích hoạt | Interval | Mục đích |
|---|---|---|---|
| on-demand | app mở / nút Làm mới | ≤1 lượt / 180s | Toàn bộ feed nóng + còn lại + user feeds + cleanup (cooldown nội bộ từng bước) |
| hot | curl admin | tự ý | ~9 feed nóng liên tục (ForexFactory, Investing, Yahoo, CNBC, query Google macro) |
| standard | curl admin | tự ý | Các feed còn lại (geopolitics, vàng, forex, crypto, Fed...) + user feeds |
| full | curl admin | tự ý | Toàn bộ + cleanup + reclassify |

**Supabase Realtime chính là WebSocket** — mobile nhận INSERT tức thì qua `postgres_changes`, không cần tự dựng WebSocket riêng. On-demand chỉ quyết định *khi nào cào*; kênh truyền không đổi.

### Database (Supabase)
Chạy `db/schema.sql` trong Supabase SQL Editor (bảng + trigger dọn 3 ngày + realtime).
Điền `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` vào Vercel.

### Mobile (Expo)
```bash
cd mobile
npm install
npm start   # chạy trên Expo Go hoặc build
```
Điền `supabaseUrl`, `supabaseAnonKey` vào `app.json` → `expo.extra`.

---

## 6. CI/CD

- `.github/workflows/ci.yml`: kiểm tra syntax backend & mobile, validate config trên mọi commit/push nhánh `main`.
- Vercel: kết nối repo, chọn `backend/` làm root directory (Framework Preset: Other) — mỗi commit lên `main` tự deploy.