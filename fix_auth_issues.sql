-- =============================================
-- FIX SIGN-IN AND SIGN-UP ISSUES
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- 1. Enable sign-up by updating Supabase Auth settings
-- Jalankan query ini di Supabase Dashboard -> Authentication -> Settings -> Site URL
-- atau gunakan SQL berikut untuk memastikan sign-up diizinkan:

-- Periksa konfigurasi auth (bukan auth.config)
SELECT * FROM auth.configurations WHERE key LIKE '%signup%' OR key LIKE '%email%';

-- Jika perlu, enable sign-up via Supabase Dashboard:
-- Authentication -> Settings -> Site URL -> Enable "Allow new users to sign up"

-- 2. Validasi semua akun yang sudah terdaftar tapi belum dikonfirmasi
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now(), 
    last_sign_in_at = now()
WHERE email_confirmed_at IS NULL;

-- 3. Berikan akses Super Admin ke email target
-- Ganti emailnya jika perlu
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'global_super_admin' FROM auth.users WHERE email = 'admin@serayu.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'global_super_admin';

-- 4. Cek user yang sudah ada dan role mereka
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    ur.role,
    p.name as profile_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;

-- 5. Jika ada user tanpa profile, buatkan profile
INSERT INTO public.profiles (user_id, name, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', email),
    email
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- 6. Jika ada user tanpa role, berikan role default
INSERT INTO public.user_roles (user_id, role)
SELECT 
    id,
    'siswa'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- 7. Verifikasi setup trigger untuk auto-assign role
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
