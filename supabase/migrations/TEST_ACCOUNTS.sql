-- =============================================
-- TEST ACCOUNTS - Insert sample data for testing
-- Run this after migrations are complete
-- =============================================

-- First, create a school
INSERT INTO public.schools (id, name, address, phone, email, motto, vision)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'SMA Negeri 1 Serayu',
  'Jl. Pendidikan No. 1, Serayu',
  '0281-123456',
  'sman1serayu@sch.id',
  'Maju Bersama Menuju Cemerlang',
  'Menjadi sekolah unggul yang menghasilkan lulusan berkualitas'
)
ON CONFLICT (id) DO NOTHING;

-- Note: Users need to be created via Supabase Auth first
-- Then their profiles and roles will be auto-created by the trigger
-- The trigger handle_new_user() automatically creates profiles and assigns roles

-- Manual insert for test accounts (requires auth.users UUID)
-- These would normally be created via signup API

-- To create test accounts manually, you need to:
-- 1. Sign up via the app/API first (this creates auth.users entry)
-- 2. Then manually assign roles if needed

-- Or use Supabase Dashboard > Authentication > Users > Add User

-- =============================================
-- ALTERNATIVE: Insert directly (requires auth admin)
-- =============================================

-- Create test users via SQL (requires supabase_admin or service_role)
-- These will only work if run with appropriate permissions

-- For manual testing via the app:
-- Use these credentials to SIGN UP (not login):

-- TEST ACCOUNT 1: Global Super Admin (will be first user)
-- Email: admin@perpuspelita.com
-- Password: Admin123!!
-- Role: global_super_admin (auto-assigned as first user)

-- TEST ACCOUNT 2: School Super Admin  
-- Email: kepsek@perpuspelita.com
-- Password: Kepsek123!!
-- Role: school_super_admin

-- TEST ACCOUNT 3: Admin
-- Email: admin1@perpuspelita.com
-- Password: Admin123!!
-- Role: admin

-- TEST ACCOUNT 4: Guru
-- Email: guru@perpuspelita.com
-- Password: Guru123!!
-- Role: guru

-- TEST ACCOUNT 5: Siswa
-- Email: siswa@perpuspelita.com
-- Password: Siswa123!!
-- Role: siswa

-- =============================================
-- SAMPLE STUDENTS DATA (for import testing)
-- =============================================

-- First ensure we have classes
INSERT INTO public.classes (id, school_id, name, major, homeroom_teacher)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'X-A', 'IPA', 'Pak Budi'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'X-B', 'IPS', 'Bu Ani'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'XI-A', 'IPA', 'Pak Dodi'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'XI-B', 'IPS', 'Bu Siti')
ON CONFLICT (id) DO NOTHING;

-- Sample students for testing import/export
INSERT INTO public.students (id, school_id, name, nis, class_id, major, email, is_active)
VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Ahmad Fauzi', '2024001', '660e8400-e29b-41d4-a716-446655440001', 'IPA', 'ahmad.fauzi@student.sch.id', true),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Budi Santoso', '2024002', '660e8400-e29b-41d4-a716-446655440001', 'IPA', 'budi.santoso@student.sch.id', true),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Citra Lestari', '2024003', '660e8400-e29b-41d4-a716-446655440002', 'IPS', 'citra.lestari@student.sch.id', true),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Dewi Anggraini', '2024004', '660e8400-e29b-41d4-a716-446655440002', 'IPS', 'dewi.anggraini@student.sch.id', true),
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Eko Prasetyo', '2024005', '660e8400-e29b-41d4-a716-446655440003', 'IPA', 'eko.prasetyo@student.sch.id', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check schools
SELECT * FROM public.schools;

-- Check classes
SELECT * FROM public.classes;

-- Check students
SELECT s.*, c.name as class_name 
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id;

-- Note: To see users and roles, check:
-- Supabase Dashboard > Authentication > Users
-- And query: SELECT * FROM public.user_roles;
