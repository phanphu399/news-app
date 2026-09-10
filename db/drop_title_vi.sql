-- ============================================================
-- NEWS APP - DỌN LƯU TRỮ: BỎ COLUMN title_vi (dịch chuyển sang client-side)
-- Chỉ chạy SAU KHI đã deploy backend & web bản mới (không còn đọc/ghi title_vi).
-- Idempotent: chạy lại được, không lỗi.
-- ============================================================

-- 1) Bỏ index dùng để backfill dịch (không còn nhu cầu):
drop index if exists idx_market_news_untranslated;
drop index if exists market_news_title_vi_idx;

-- 2) Bỏ column giúp bảng gọn hơn, giảm I/O mỗi lần đọc/ghi:
alter table public.market_news
  drop column if exists title_vi;

-- 3) Kiểm tra đã xong:
-- select column_name from information_schema.columns
--  where table_schema = 'public' and table_name = 'market_news'
--  order by ordinal_position;