-- =============================================
-- DEBUG LOGIN 400 BAD REQUEST ERROR
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- 1. Cek user 1serayu.1@gmail.com status
SELECT 
    id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    created_at,
    raw_user_meta_data,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Email not confirmed'
        WHEN last_sign_in_at IS NULL THEN 'Never signed in'
        ELSE 'Active'
    END as status
FROM auth.users 
WHERE email = '1serayu.1@gmail.com';

-- 2. Cek profile dan role
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.name,
    p.user_id as profile_user_id,
    ur.role,
    ur.created_at as role_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = '1serayu.1@gmail.com';

-- 3. Auto-confirm email jika belum dikonfirmasi
UPDATE auth.users 
SET email_confirmed_at = now(), 
    last_sign_in_at = now()
WHERE email = '1serayu.1@gmail.com' 
AND email_confirmed_at IS NULL;

-- 4. Konfirmasi hasil update
SELECT 
    id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Email not confirmed'
        ELSE 'Email confirmed'
    END as confirmation_status
FROM auth.users 
WHERE email = '1serayu.1@gmail.com';
