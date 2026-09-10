-- ADD created_at COLUMN TO market_news
-- Mục đích: phân loại thứ tự hiển thị khi 2 tin trùng published_at —
-- tin nào được chèn (tới trước) sẽ hiển thị trước.

alter table public.market_news
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_market_news_created_at
  on public.market_news (published_at desc, created_at asc);