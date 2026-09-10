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

-- Auto cleanup: purge records older than 3 days.
-- Read-only role used by the API cannot install triggers via the client;
-- run the function + trigger once in the Supabase SQL editor.
create or replace function public.delete_old_market_news()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.market_news
  where published_at < now() - interval '3 days';
  return null;
end;
$$;

drop trigger if exists trg_delete_old_market_news on public.market_news;
create trigger trg_delete_old_market_news
after insert or update on public.market_news
for each statement execute function public.delete_old_market_news();

-- Realtime: enable broadcast for mobile subscriptions.
alter publication supabase_realtime add table public.market_news;