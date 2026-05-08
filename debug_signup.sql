-- =============================================
-- DEBUG SIGNUP ISSUES
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- 1. Check if auth.users table exists and structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 2. Check existing users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_signup';

-- 4. Check if auto_confirm_user function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'auto_confirm_user' 
AND routine_schema = 'public';

-- 5. Test manual user creation (for debugging)
-- Uncomment to test:
-- INSERT INTO auth.users (email, password_hash, email_confirmed_at, raw_user_meta_data)
-- VALUES ('test@example.com', crypt('password123', gen_salt('bf')), now(), '{"name": "Test User"}')
-- RETURNING id, email, email_confirmed_at;
