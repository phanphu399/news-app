-- ============================================================
-- NEWS APP - MAINTENANCE & POOL FIX
-- Chạy 1 lần trong Supabase SQL Editor (hoặc psql).
-- Chữa lỗi: "Connection terminated due to connection timeout"
-- ============================================================

-- 1) DIAGNOSTIC (chạy trước để xem cái gì đang kẹt pool)
-----------------------------------------------------------
-- a) Query nào đang chạy / chờ:
--    select pid, state, wait_event_type, query_start,
--           left(query, 80) as query
--    from pg_stat_activity
--    where state <> 'idle' and pid <> pg_backend_pid()
--    order by query_start;

-- b) Pool còn bao nhiêu chỗ trống:
--    select count(*) filter (where state = 'active') as active,
--           count(*) filter (where state = 'idle in transaction') as idle_in_txn,
--           count(*) as total
--    from pg_stat_activity;

-- c) market_news béo / nhiều rác chưa:
--    select relname, n_live_tup, n_dead_tup, last_autovacuum, seq_scan, idx_scan
--    from pg_stat_user_tables where relname = 'market_news';

-- 2) XỬ LÝ KHẨN CẤP: giết query chạy > 5 phút (đang ôm connection)
--    Dùng DO block: tiến trình nào không đủ quyền để giết thì bỏ qua, không abort cả script.
-----------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select pid, usename, state
    from pg_stat_activity
    where state = 'active'
      and pid <> pg_backend_pid()
      and query_start < now() - interval '5 minutes'
  loop
    begin
      perform pg_terminate_backend(r.pid);
      raise notice '[cleanup] killed pid % (% state %)', r.pid, r.usename, r.state;
    exception when others then
      raise notice '[cleanup] skip pid % (%), %', r.pid, r.usename, sqlerrm;
    end;
  end loop;
end $$;

-- 3) INDEX: chữa tận gốc các truy vấn đang quét cả bảng mỗi phút
-----------------------------------------------------------
create index if not exists idx_market_news_published_at
  on public.market_news (published_at desc);

create index if not exists idx_market_news_category
  on public.market_news (category);

create index if not exists idx_market_news_important
  on public.market_news (is_important);

create index if not exists idx_market_news_source
  on public.market_news (source);

-- index riêng cho query "chưa dịch" (title_vi null)
create index if not exists idx_market_news_untranslated
  on public.market_news (published_at desc)
  where title_vi is null;

-- 4) TIME-OUT: query chạy quá lâu tự chết, không ôm connection
-----------------------------------------------------------
alter database postgres set statement_timeout = '30s';
alter database postgres set idle_in_transaction_session_timeout = '30s';

-- 5) DỌN RÁC SAU KHI CÓ INDEX (chạy 1 lần, có thể chậm bằng index mới)
-----------------------------------------------------------
vacuum (analyze) public.market_news;

-- 6) LUÔNG CHẠY CHO CRON (chống chạy chồng lấn)
-----------------------------------------------------------
create table if not exists public.cron_state (
  id int primary key default 1,
  ran_at timestamptz
);
insert into public.cron_state (id, ran_at)
values (1, now())
on conflict (id) do nothing;