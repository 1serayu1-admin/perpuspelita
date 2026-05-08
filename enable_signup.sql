-- =============================================
-- ENABLE SIGN-UP FOR YOUR SUPABASE PROJECT
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- Enable sign-up by updating auth configuration
-- Note: This might not work via SQL depending on Supabase version
-- You may need to do this via the Dashboard instead

-- Method 1: Try SQL approach
UPDATE auth.configurations 
SET value = 'true' 
WHERE key = 'signup_enabled';

-- Method 2: Check current auth settings
SELECT * FROM auth.configurations;

-- Method 3: If SQL doesn't work, use Supabase Dashboard:
-- 1. Go to Authentication -> Settings
-- 2. Find "Site URL" section
-- 3. Enable "Allow new users to sign up"
-- 4. Save changes

-- Method 4: Enable email confirmation bypass (for testing)
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- Check if users can now sign up by testing the sign-up flow
