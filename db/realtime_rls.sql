-- MARKET NEWS: Row Level Security cho anon key (web app / mobile app)
-- Chạy block này trong Supabase SQL Editor (idempotent, an toàn chạy lại).

-- Nếu bảng chưa bật RLS thì bật (an toàn nếu đã bật).
alter table public.market_news enable row level security;

-- Anon key được quyền ĐỌC mọi dòng (chỉ đọc, không ghi) -> bảng tin hiển thị được.
-- Lưu ý: policy này cũng cho phép Supabase Realtime gửi INSERT/DELETE về app.
drop policy if exists "market_news_anon_read" on public.market_news;
create policy "market_news_anon_read"
on public.market_news
for select
using (true);

-- (Tùy chọn) Anon KHÔNG được phép insert/update/delete — chỉ service_role thao tác.
drop policy if exists "market_news_anon_write" on public.market_news;
drop policy if exists "market_news_anon_update" on public.market_news;
drop policy if exists "market_news_anon_delete" on public.market_news;