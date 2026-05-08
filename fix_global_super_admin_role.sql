-- =============================================
-- FIX GLOBAL SUPER ADMIN ROLE FOR 1serayu.1@gmail.com
-- Run this in Supabase SQL Editor
-- =============================================

-- STEP 1: Check current state
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.name,
    p.user_id as profile_user_id,
    p.school_id,
    ur.role,
    ur.created_at as role_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = '1serayu.1@gmail.com';

-- STEP 2: Create profile if missing
INSERT INTO public.profiles (user_id, name, email, school_id)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', 'Super Admin'),
    u.email,
    NULL  -- global_super_admin doesn't need school_id
FROM auth.users u
WHERE u.email = '1serayu.1@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- STEP 3: Remove any existing role assignments (to avoid duplicates)
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = '1serayu.1@gmail.com');

-- STEP 4: Insert correct role assignment
INSERT INTO public.user_roles (user_id, role, school_id)
SELECT 
    u.id,
    'global_super_admin',
    NULL  -- global_super_admin doesn't need school_id
FROM auth.users u
WHERE u.email = '1serayu.1@gmail.com';

-- STEP 5: Verify the fix
SELECT 
    u.id,
    u.email,
    p.name,
    p.school_id,
    ur.role,
    ur.created_at as role_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = '1serayu.1@gmail.com';

-- STEP 6: Check for any other users that might need role fixes
SELECT 
    u.id,
    u.email,
    p.name,
    ur.role,
    CASE 
        WHEN ur.role IS NULL THEN 'MISSING ROLE'
        WHEN ur.role = 'siswa' AND u.email LIKE '%admin%' THEN 'POTENTIAL MISMATCH'
        ELSE 'OK'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.created_at DESC;
