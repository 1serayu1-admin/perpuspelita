-- =============================================
-- UPDATE USER 1serayu.1@gmail.com TO SUPERADMIN
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- 1. Cek user yang ada
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = '1serayu.1@gmail.com';

-- 2. Cek profile dan role saat ini
SELECT 
    u.id,
    u.email,
    p.name,
    p.user_id as profile_user_id,
    ur.role,
    ur.created_at as role_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = '1serayu.1@gmail.com';

-- 3. Buat profile jika belum ada
INSERT INTO public.profiles (user_id, name, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', email),
    email
FROM auth.users u
WHERE email = '1serayu.1@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- 4. Hapus role lama jika ada dan insert baru
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = '1serayu.1@gmail.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'global_super_admin'
FROM auth.users 
WHERE email = '1serayu.1@gmail.com';

-- 5. Konfirmasi hasil update
SELECT 
    u.id,
    u.email,
    p.name,
    ur.role,
    ur.created_at as role_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = '1serayu.1@gmail.com';
