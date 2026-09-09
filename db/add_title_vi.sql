-- Chạy block này trong Supabase SQL Editor. Chạy lại nhiều lần cũng an toàn.
-- Cột title_vi lưu tiêu đề TIẾNG VIỆT do backend (Google Translate/MyMemory) dịch khi scrape.

-- 1) Thêm cột lưu tiêu đề đã dịch
alter table public.market_news
add column if not exists title_vi text;

-- 2) Index hỗ trợ tìm nhanh tin chưa dịch để lấp dần
create index if not exists market_news_title_vi_idx
on public.market_news (published_at desc)
where title_vi is null;