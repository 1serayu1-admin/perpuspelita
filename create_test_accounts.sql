-- =============================================
-- CREATE TEST ACCOUNTS FOR ALL ROLES
-- Run this in Supabase SQL Editor
-- =============================================

-- First, let's check if we have any schools to assign
SELECT id, name FROM public.schools ORDER BY created_at DESC LIMIT 5;

-- Create test school if none exists
INSERT INTO public.schools (id, name, address, phone, email)
SELECT 
    gen_random_uuid()::text,
    'TEST SEKOLAH PERPUSTAKAAN',
    'Jl. Test No. 123',
    '08123456789',
    'test@sekolah.test'
WHERE NOT EXISTS (SELECT 1 FROM public.schools LIMIT 1);

-- Get the school ID for use in test accounts
-- Note: Replace 'SCHOOL_ID_HERE' with actual school ID from the query above

-- 1. Create TEST global_super_admin (if not exists)
-- This account is already handled by demo mode, but let's ensure it exists in auth
-- Email: test.global@perpus.test | Password: TestGlobal123!

-- 2. Create TEST school_super_admin
-- Email: test.school@perpus.test | Password: TestSchool123!

-- 3. Create TEST admin
-- Email: test.admin@perpus.test | Password: TestAdmin123!

-- 4. Create TEST guru
-- Email: test.guru@perpus.test | Password: TestGuru123!

-- 5. Create TEST siswa
-- Email: test.siswa@perpus.test | Password: TestSiswa123!

-- =============================================
-- ACTUAL USER CREATION QUERIES
-- =============================================

-- Get the first school ID
DO $$
DECLARE
    school_id TEXT;
BEGIN
    SELECT id INTO school_id FROM public.schools LIMIT 1;
    
    IF school_id IS NOT NULL THEN
        -- Create school_super_admin
        INSERT INTO public.profiles (user_id, name, email, school_id)
        VALUES (
            gen_random_uuid()::text,
            'TEST School Super Admin',
            'test.school@perpus.test',
            school_id
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Create admin
        INSERT INTO public.profiles (user_id, name, email, school_id)
        VALUES (
            gen_random_uuid()::text,
            'TEST Admin',
            'test.admin@perpus.test',
            school_id
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Create guru
        INSERT INTO public.profiles (user_id, name, email, school_id)
        VALUES (
            gen_random_uuid()::text,
            'TEST Guru',
            'test.guru@perpus.test',
            school_id
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Create siswa
        INSERT INTO public.profiles (user_id, name, email, school_id)
        VALUES (
            gen_random_uuid()::text,
            'TEST Siswa',
            'test.siswa@perpus.test',
            school_id
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Test profiles created with school_id: %', school_id;
    ELSE
        RAISE NOTICE 'No school found. Please create a school first.';
    END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check all test profiles
SELECT 
    p.user_id,
    p.name,
    p.email,
    p.school_id,
    s.name as school_name,
    ur.role
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email LIKE 'test.%@perpus.test'
ORDER BY p.email;

-- Check for any orphan records (profiles without roles)
SELECT 
    p.user_id,
    p.name,
    p.email,
    'NO_ROLE' as status
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email LIKE 'test.%@perpus.test'
AND ur.user_id IS NULL;
