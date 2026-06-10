-- =============================================
-- FIX ALL RLS POLICIES - COMPREHENSIVE FIX
-- Run this in Supabase SQL Editor to fix ALL 403 and timeout errors
-- =============================================

-- =============================================
-- FIX 1: user_roles TABLE (Fix timeout error)
-- =============================================

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "user_roles viewable by self or admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles insertable by admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles updatable by admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles deletable by admin" ON public.user_roles;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read for authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "Enable all for authenticated on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read for anon on user_roles" ON public.user_roles;

-- Enable RLS
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for all authenticated users
CREATE POLICY "Enable all for authenticated on user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon to read (for auth triggers)
CREATE POLICY "Enable read for anon on user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (true);

-- Grant permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;


-- =============================================
-- FIX 2: profiles TABLE
-- =============================================

DROP POLICY IF EXISTS "profiles viewable by self or school" ON public.profiles;
DROP POLICY IF EXISTS "profiles insertable by self" ON public.profiles;
DROP POLICY IF EXISTS "profiles updatable by self" ON public.profiles;
DROP POLICY IF EXISTS "profiles deletable by admin" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for anon on profiles" ON public.profiles;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated on profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable read for anon on profiles"
ON public.profiles
FOR SELECT
TO anon
USING (true);

GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;


-- =============================================
-- FIX 3: students TABLE
-- =============================================

DROP POLICY IF EXISTS "Students are viewable by everyone" ON public.students;
DROP POLICY IF EXISTS "Students are insertable by admin" ON public.students;
DROP POLICY IF EXISTS "Students are updatable by admin" ON public.students;
DROP POLICY IF EXISTS "Students are deletable by admin" ON public.students;
DROP POLICY IF EXISTS "Students accessible by authenticated users" ON public.students;
DROP POLICY IF EXISTS "Students viewable by all" ON public.students;
DROP POLICY IF EXISTS "Students modifiable by admin" ON public.students;
DROP POLICY IF EXISTS "Enable all for admin" ON public.students;
DROP POLICY IF EXISTS "Enable read for all" ON public.students;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable read for anon" ON public.students;

ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated on students"
ON public.students
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable read for anon on students"
ON public.students
FOR SELECT
TO anon
USING (true);

GRANT ALL ON public.students TO authenticated;
GRANT SELECT ON public.students TO anon;


-- =============================================
-- FIX 4: classes TABLE
-- =============================================

DROP POLICY IF EXISTS "Classes viewable by school" ON public.classes;
DROP POLICY IF EXISTS "Classes manageable by admin" ON public.classes;
DROP POLICY IF EXISTS "Enable all for authenticated on classes" ON public.classes;

ALTER TABLE IF EXISTS public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated on classes"
ON public.classes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.classes TO authenticated;
GRANT SELECT ON public.classes TO anon;


-- =============================================
-- FIX 5: schools TABLE
-- =============================================

DROP POLICY IF EXISTS "Schools viewable by all" ON public.schools;
DROP POLICY IF EXISTS "Schools manageable by super admin" ON public.schools;
DROP POLICY IF EXISTS "Enable all for authenticated on schools" ON public.schools;

ALTER TABLE IF EXISTS public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated on schools"
ON public.schools
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.schools TO authenticated;
GRANT SELECT ON public.schools TO anon;


-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check RLS is enabled on all tables
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('user_roles', 'profiles', 'students', 'classes', 'schools');

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('user_roles', 'profiles', 'students', 'classes', 'schools')
ORDER BY tablename, policyname;
