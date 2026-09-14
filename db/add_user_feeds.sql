-- Bảng lưu nguồn tin do người dùng thêm (backend ghi bằng service key, anon chỉ đọc)
create table if not exists public.user_feeds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rss_url text not null unique,
  category text not null default 'Custom',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_fetched_at timestamptz,
  last_error text
);

alter table public.user_feeds enable row level security;

drop policy if exists "user_feeds_select_for_all" on public.user_feeds;
create policy "user_feeds_select_for_all" on public.user_feeds
  for select using (true);

-- Chỉ service key (bypass RLS) mới insert/update/delete được; anon không có quyền ghi
revoke insert, update, delete on public.user_feeds from anon, authenticated;