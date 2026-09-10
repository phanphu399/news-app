-- ============================================================
-- NEWS APP - TÌM TOP QUERY TỐN RESOURCE
-- Chạy trong SQL Editor để biết cái gì đang đốt compute.
-- ============================================================

-- 1) Bật pg_stat_statements (1 lần) nếu chưa có:
create extension if not exists pg_stat_statements;

-- 2) TOP 20 query tốn tổng thời gian nhất (xem sau vài phút chạy cron):
select queryid,
       round((total_exec_time / 1000)::numeric, 1)  as total_sec,
       calls,
       round(mean_exec_time::numeric, 1)            as mean_ms,
       left(query, 120)                             as query
from pg_stat_statements
order by total_exec_time desc
limit 20;

-- 3) Query nào CÒN ĐANG chạy / đang chờ (kẹt pool):
select pid, state, wait_event_type, wait_event,
       now() - query_start as age,
       usename,
       left(query, 100) as query
from pg_stat_activity
where state in ('active', 'idle in transaction')
  and pid <> pg_backend_pid()
order by age desc;

-- 4) Bảng phình / nhiều rác (dead tuples) → autovacuum không theo kịp:
select relname,
       n_live_tup,
       n_dead_tup,
       round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) as dead_pct,
       last_autovacuum,
       seq_scan,
       idx_scan
from pg_stat_user_tables
where n_dead_tup > 1000
order by n_dead_tup desc;

-- 5) Nếu ra biểu hiện rác: dọn ngay (chạy sau khi đã tạo index trong maintenance.sql)
-- vacuum (analyze) public.market_news;