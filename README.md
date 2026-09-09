# ASTER — Realtime Forex & Macro News App

Monorepo chứa **Serverless Backend (Vercel Cron)** + **Mobile App (Expo / React Native)** cho ứng dụng tin tức Forex & Macro theo thời gian thực. Toàn bộ commit ở nhánh `main` được tự động deploy bởi Vercel.

---

## 1. Tổng quan (System Overview)

- **Backend** (`backend/`): Vercel Serverless Functions + Cron Job chạy **1 phút/lần** cào tin tức, ghi vào Supabase và bắn push notification qua FCM.
- **Mobile** (`mobile/`): Ứng dụng Expo (React Native) theo **Clean Architecture**, tách biệt UI Views (dumb) và ViewModels (smart), nhận dữ liệu tức thì bằng **Supabase Realtime**.

```
news-app/
│
├── .github/workflows/ci.yml     # Pipeline CI tự động kiểm tra backend + mobile
│
├── backend/                     # [VERCEL SERVERLESS PROJECT]
│   ├── api/cron-fetch.js        # Endpoint chạy định kỳ (1 phút/lần) — Controller (Nhạc trưởng)
│   ├── src/
│   │   ├── config/constants.js  # Keywords đỏ, URL Google News, RSS feeds
│   │   ├── services/
│   │   │   ├── scraper.js       # Cào RSS + parse XML (fast-xml-parser)
│   │   │   ├── supabase.js      # Upsert, kiểm tra tồn tại, dọn dữ liệu 3 ngày
│   │   │   └── fcm.js           # Firebase Cloud Messaging (HTTP v1)
│   │   └── utils/helpers.js     # Băm URL → ID, check tin đỏ, sanitize
│   ├── package.json
│   ├── vercel.json              # Cron "* * * * *" → /api/cron-fetch
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

## 3. Data Fetching Pipeline (Vercel API)

> **Lưu ý quan trọng (Hobby plan):** Vercel Hobby chỉ cho phép cron tối đa **1 lần/ngày** — lịch `* * * * *` (mỗi phút) bị chặn deploy. Do đó nhịp 1 phút được đảm bảo bằng **External Scheduler** (xem mục 5). `vercel.json` chỉ giữ 1 cron dự phòng mỗi ngày (`0 1 * * *`) để vẫn có lượt chạy ngay cả khi external scheduler tạm lỗi.

`vercel.json` (Hobby-safe, dự phòng 1 lần/ngày):

```json
{ "crons": [{ "path": "/api/cron-fetch", "schedule": "0 1 * * *" }] }
```

Luồng xử lý trong `api/cron-fetch.js` (Controller, không chứa logic nghiệp vụ):

1. **Scrape** (`services/scraper.js`):
   - **Google News Proxy** (`news.google.com/rss/search`): 3 luồng query — Vĩ mô (FED, CPI), Hàng hóa (XAUUSD, Oil), Báo Paywall (site:bloomberg.com, site:wsj.com, site:reuters.com), lọc tin trong 1 giờ.
   - **Direct RSS**: Yahoo Finance, CNBC, White House — parse bằng `fast-xml-parser`.
2. **Tagging**: tiêu đề chứa keyword đỏ (FED, FOMC, CPI, XAUUSD, WAR, ...) → `is_important = true`.
3. **Dedupe**: ID = hash URL; chỉ notify các tin quan trọng **mới** (chưa tồn tại trong DB) để tránh beep lặp mỗi phút.
4. **Push**: `services/fcm.js` gọi FCM **HTTP v1** (OAuth2 service account) với `sound: "default"` / file `beep.wav` để điện thoại **BEEP** cảnh báo kể cả khi khóa màn hình.
5. **Cleanup**: xóa bản ghi quá 3 ngày.

Bảo mật endpoint: nếu đặt `CRON_SECRET`, request phải kèm `Authorization: Bearer <CRON_SECRET>` (Vercel Cron tự động gắn hoặc cấu hình Header auth).

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

### External Scheduler — chạy mỗi phút (Hobby plan)
Vì Hobby không cho cron mỗi phút, dùng 1 dịch vụ scheduler để gọi endpoint mỗi phút:

1. Deploy thành công → lấy URL: `https://<your-app>.vercel.app/api/cron-fetch`
2. Đặt `CRON_SECRET` trong Vercel env (VD: `8f3a...`).
3. Tạo scheduler tại **cron-job.org** (hoặc Crontap, Upstash QStash):
   - **URL**: `https://<your-app>.vercel.app/api/cron-fetch`
   - **Method**: `GET`
   - **Interval**: `1` phút (`* * * * *`)
   - **Headers**: `Authorization: Bearer <CRON_SECRET>`
4. Bấm **Enable/Start** → endpoint sẽ được gọi mỗi phút, hòan toàn không lệ thuộc giới hạn cron của Vercel.

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