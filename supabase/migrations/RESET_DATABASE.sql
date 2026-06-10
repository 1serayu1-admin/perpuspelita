-- =============================================
-- RESET DATABASE - Run this if you get "table already exists" error
-- This will DROP all tables and recreate them
-- WARNING: This will DELETE all data!
-- =============================================

-- Drop all tables in correct order (foreign keys first)
DROP TABLE IF EXISTS public.ai_quotas CASCADE;
DROP TABLE IF EXISTS public.backup_history CASCADE;
DROP TABLE IF EXISTS public.authorized_devices CASCADE;
DROP TABLE IF EXISTS public.security_logs CASCADE;
DROP TABLE IF EXISTS public.borrowings CASCADE;
DROP TABLE IF EXISTS public.borrow_requests CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.decrement_ai_quota CASCADE;
DROP FUNCTION IF EXISTS public.insert_security_log CASCADE;
DROP FUNCTION IF EXISTS public.increment_book_available CASCADE;
DROP FUNCTION IF EXISTS public.decrement_book_available CASCADE;
DROP FUNCTION IF EXISTS public.get_email_by_username CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.is_same_school CASCADE;
DROP FUNCTION IF EXISTS public.get_user_school_id CASCADE;
DROP FUNCTION IF EXISTS public.has_any_role CASCADE;
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- Drop type
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Now run the original ALL_MIGRATIONS.sql file
-- Copy-paste the content from ALL_MIGRATIONS.sql below this line
-- OR run ALL_MIGRATIONS.sql separately after this

SELECT 'Database reset complete. Now run ALL_MIGRATIONS.sql' as status;
