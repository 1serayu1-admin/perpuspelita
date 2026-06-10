-- =============================================
-- RESET DATABASE - Fresh Start
-- Hapus semua user & roles, keep master data
-- =============================================

-- 1. Hapus semua user_roles
DELETE FROM public.user_roles;

-- 2. Hapus semua profiles (kecuali Super Admin)
DELETE FROM public.profiles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'superadmin@perpuspelita.id'
);

-- 3. Hapus semua auth.users (kecuali Super Admin)
DELETE FROM auth.users 
WHERE email != 'superadmin@perpuspelita.id';

-- 4. Verifikasi - hanya Super Admin yang tersisa
SELECT id, email, raw_user_meta_data 
FROM auth.users;

-- 5. Count master data (harusnya masih ada)
SELECT 
  (SELECT COUNT(*) FROM books) as total_buku,
  (SELECT COUNT(*) FROM students) as total_siswa,
  (SELECT COUNT(*) FROM teachers) as total_guru,
  (SELECT COUNT(*) FROM categories) as total_kategori,
  (SELECT COUNT(*) FROM schools) as total_sekolah;
