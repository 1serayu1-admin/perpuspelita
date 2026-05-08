-- =============================================
-- FIX SIGNUP EMAIL ISSUES
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- 1. Check current auth configuration (different table names)
SELECT * FROM auth.config WHERE key LIKE '%email%' OR key LIKE '%signup%' OR key LIKE '%confirm%';

-- 2. If that doesn't work, check what auth tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' ORDER BY table_name;

-- 3. Disable email confirmation temporarily for testing
-- Try different possible table/column names
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'enable_email_confirmations';

-- 3. Auto-confirm all existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now(), 
    last_sign_in_at = now()
WHERE email_confirmed_at IS NULL;

-- 4. Check if there are any users with confirmation issues
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 5. Create a function to auto-confirm new users (temporary fix)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-confirm the user's email
  NEW.email_confirmed_at = now();
  NEW.confirmed_at = now();
  RETURN NEW;
END;
$$;

-- 6. Create trigger to auto-confirm new signups
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- 7. Test the signup process by creating a test user
-- Uncomment the lines below to test (replace with your test email)
-- INSERT INTO auth.users (email, password_hash, email_confirmed_at)
-- VALUES ('test@example.com', 'hashed_password', now());

-- 8. Verify the trigger is working
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_signup';
