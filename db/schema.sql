-- market_news table (PostgreSQL / Supabase)

create table if not exists public.market_news (
  id           text primary key,          -- Base64url hash of the article URL
  title        text not null,
  source       text not null default 'Google News',
  url          text not null,
  category     text not null default 'Macro',
  is_important boolean not null default false,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now()  -- thời điểm hệ thống nhận tin (phá thứ tự khi trùng giờ)
);

create index if not exists idx_market_news_published_at on public.market_news (published_at desc, created_at asc);
create index if not exists idx_market_news_is_important on public.market_news (is_important);

-- Auto cleanup: BASE DỮ LIỆU KHÔNG tự xoá.
-- Việc dọn tin cũ (>3 ngày) và rác/trùng được backend xử lý trong cron
-- (deleteSpamNews + cleanupOldNews trong /api/cron-fetch tier=full).
-- KHÔNG tạo hàm SECURITY DEFINER + trigger ở đây nữa: hàm này tạo lỗ hổng
-- RPC (anon gọi được qua /rest/v1/rpc/...) và mâu thuẫn với db/security_fix.sql.
-- Nếu DB còn sót hàm/trigger từ bản cũ, chạy db/security_fix.sql để gỡ.

-- Realtime: enable broadcast for mobile subscriptions.
alter publication supabase_realtime add table public.market_news;