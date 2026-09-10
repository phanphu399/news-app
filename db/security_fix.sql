-- ============================================================
-- NEWS APP - SECURITY FIX
-- Chặn lỗ hổng: public.delete_old_market_news() là SECURITY DEFINER
-- nhưng anon/authenticated gọi được qua /rest/v1/rpc/...
-- ============================================================

-- CÁCH A (khuyên dùng): backend tự dọn tin cũ (cron cleanupOldNews, mỗi 6h),
-- hàm RPC này là thừa → xoá hẳn + tắt job lịch Supabase nếu có (Dashboard -> Database -> Cron Jobs).
drop function if exists public.delete_old_market_news();

-- CÁCH B (nếu BẮT BUỘC giữ hàm cho job lịch Supabase chạy):
-- Chỉ cho service_role gọi qua RPC; chặn anon & authenticated.
-- (Job lịch Supabase chạy bằng role postgres nên vẫn hoạt động.)
-- revoke execute on function public.delete_old_market_news() from anon, authenticated;
-- revoke execute on function public.delete_old_market_news() from public;
-- grant execute on function public.delete_old_market_news() to service_role;

-- Kiểm tra còn ai được gọi nữa không:
-- select proname, proacl
-- from pg_proc
-- where proname = 'delete_old_market_news';