-- ============================================================
-- NEWS APP - KIỂM TRA THỨ ĂN RAM TRÊN SUPABASE
-- Chạy trong SQL Editor từng câu (mỗi câu 1 kết quả).
-- ============================================================

-- 1) BẢNG TO NHẤT: bao nhiêu dòng + index mấy MB (index nhiều = RAM tốn để cache)
--    Dự kiến: market_news phải quay về ~100 dòng sau khi deploy backend mới.
select table_schema || '.' || table_name as tbl,
       pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as total_size,
       pg_size_pretty(pg_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as data_size,
       pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))
           - pg_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as index_size
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) desc;

-- 2) ĐANG CÓ BAO NHIÊU KẾT NỐI (mỗi kết nối chiếm RAM riêng):
--    app → 1 websocket realtime/tab web. Đóng bớt tab cũ để giảm.
select usename, state, count(*)
from pg_stat_activity
group by usename, state
order by count(*) desc;

-- 3) RÁC CHƯA DỌN (dead tuples = chiếm RAM & bị autovacuum phải quét):
--    Nếu n_dead_tup lớn → chạy VACUUM qua psql (xem maintenance.sql mục 5).
select relname, n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) as dead_pct
from pg_stat_user_tables
where n_dead_tup > 0
order by n_dead_tup desc;

-- 4) pg_stat_statements tích 256MB stats từ lúc bắt đầu → reset để xả bộ nhớ:
select pg_stat_statements_reset();

-- 5) XEM NGƯỠNG RAM CỦA MÁY (để biết 80% là bao nhiêu):
show shared_buffers;
show work_mem;
show max_connections;

-- DẬY MẸO:
-- - Chạy db/drop_title_vi.sql (xóa column đã bỏ) → nhẹ hơn, cả ghi lẫn cache.
-- - Giữ cron-chạy-thưa (lock 90s) như bản backend mới.
-- - Tắt realtime trên bảng user_feeds / cron_state (Dashboard → Database → Replication)
--   vì client không subscribe 2 bảng đó → giảm WAL + kết nối.