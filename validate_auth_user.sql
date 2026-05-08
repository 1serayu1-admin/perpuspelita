-- =============================================
-- SUPABASE USER VALIDATION
-- Run this in Supabase SQL Editor to check auth user
-- =============================================

-- Check if test user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    phone,
    banned_until,
    deleted_at
FROM auth.users 
WHERE email IN ('1serayu1@gmail.com', '1serayu.1@gmail.com')
ORDER BY created_at DESC;

-- Check user profile data
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.email,
    p.school_id,
    s.name as school_name,
    p.is_active,
    p.created_at
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
WHERE p.email IN ('1serayu1@gmail.com', '1serayu.1@gmail.com')
ORDER BY p.created_at DESC;

-- Check user roles
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.school_id,
    s.name as school_name,
    ur.created_at
FROM public.user_roles ur
LEFT JOIN public.schools s ON ur.school_id = s.id
WHERE ur.user_id IN (
    SELECT id FROM auth.users WHERE email IN ('1serayu1@gmail.com', '1serayu.1@gmail.com')
)
ORDER BY ur.created_at DESC;

-- Check for any auth configuration issues
SELECT 
    'auth.users count' as metric,
    COUNT(*) as value
FROM auth.users
UNION ALL
SELECT 
    'confirmed users' as metric,
    COUNT(*)
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
    'banned users' as metric,
    COUNT(*)
FROM auth.users 
WHERE banned_until IS NOT NULL AND banned_until > NOW()
UNION ALL
SELECT 
    'deleted users' as metric,
    COUNT(*)
FROM auth.users 
WHERE deleted_at IS NOT NULL;

-- Test Supabase auth configuration
SELECT 
    'config' as setting,
    current_setting('app.settings') as value
UNION ALL
SELECT 
    'timezone' as setting,
    current_setting('timezone') as value;
