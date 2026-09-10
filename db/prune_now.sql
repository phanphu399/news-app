-- DỌN NGAY: giữ 100 tin mới nhất, xóa phần còn lại.
-- (Cleanup tự động trong backend sẽ làm việc này sau khi deploy; script này để xóa tức thì.)
delete from public.market_news
where id not in (
  select id
  from public.market_news
  order by published_at desc
  limit 100
);

-- Kiểm tra số còn lại (nên về ~100):
select count(*) as remaining from public.market_news;