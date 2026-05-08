-- =============================================
-- SIMPLE SIGNUP FIX - NO CONFIG TABLE NEEDED
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- 1. Auto-confirm all existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = now(), 
    last_sign_in_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. Create trigger to auto-confirm new users (bypasses email confirmation)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-confirm the user's email immediately (don't update generated column)
  NEW.email_confirmed_at = now();
  RETURN NEW;
END;
$$;

-- 3. Create trigger to auto-confirm new signups
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- 4. Check existing users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 5. Verify trigger is working
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_signup';

-- =============================================
-- INSTRUCTIONS:
-- 1. Run this SQL script
-- 2. Test your sign-up form - it should work now
-- 3. First user who signs up gets global_super_admin role
-- =============================================
