-- Chạy block này trong Supabase SQL Editor.
-- 1) Cho phép anon đọc tin tức (nếu chưa chạy db/realtime_rls.sql)
create policy "public read market_news"
on public.market_news for select
to anon, authenticated
using (true);

-- 2) Thêm cột lưu tiêu đề đã dịch (server dịch và ghi vào đây)
alter table public.market_news
add column if not exists title_vi text;

-- Index hỗ trợ tìm nhanh tin chưa dịch
create index if not exists market_news_title_vi_idx
on public.market_news (published_at desc)
where title_vi is null;