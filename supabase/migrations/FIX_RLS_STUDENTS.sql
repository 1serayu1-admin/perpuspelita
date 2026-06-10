-- =============================================
-- FIX RLS POLICY FOR STUDENTS TABLE
-- Run this in Supabase SQL Editor to fix 403 Forbidden errors
-- =============================================

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Students are viewable by everyone" ON public.students;
DROP POLICY IF EXISTS "Students are insertable by admin" ON public.students;
DROP POLICY IF EXISTS "Students are updatable by admin" ON public.students;
DROP POLICY IF EXISTS "Students are deletable by admin" ON public.students;
DROP POLICY IF EXISTS "Students accessible by authenticated users" ON public.students;
DROP POLICY IF EXISTS "Students viewable by all" ON public.students;
DROP POLICY IF EXISTS "Students modifiable by admin" ON public.students;
DROP POLICY IF EXISTS "Enable all for admin" ON public.students;
DROP POLICY IF EXISTS "Enable read for all" ON public.students;

-- Step 2: Enable RLS (if not already enabled)
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;

-- Step 3: Create permissive policy for all authenticated users
-- This allows any logged-in user to perform CRUD operations
CREATE POLICY "Enable all operations for authenticated users"
ON public.students
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 4: Also allow anon (for testing - remove in production if needed)
CREATE POLICY "Enable read for anon"
ON public.students
FOR SELECT
TO anon
USING (true);

-- Step 5: Grant necessary permissions
GRANT ALL ON public.students TO authenticated;
GRANT SELECT ON public.students TO anon;
-- Note: If your students table has an auto-increment ID, uncomment below:
-- GRANT USAGE, SELECT ON SEQUENCE IF EXISTS public.students_id_seq TO authenticated;

-- =============================================
-- VERIFICATION QUERIES (Optional - Run to check)
-- =============================================

-- Check RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'students';

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'students';

-- =============================================
-- ALTERNATIVE: STRICT POLICY (For production)
-- Uncomment below and comment out the permissive policy above
-- if you want stricter access control
-- =============================================

/*
-- Strict policy - only admins can modify
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.students;

-- Allow read for all authenticated users
CREATE POLICY "Enable read for authenticated"
ON public.students
FOR SELECT
TO authenticated
USING (true);

-- Allow all operations for admin roles only
CREATE POLICY "Enable all for admin"
ON public.students
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'global_super_admin', 'school_super_admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'global_super_admin', 'school_super_admin', 'staff')
  )
);
*/

-- =============================================
-- INSTRUCTIONS:
-- 1. Copy all SQL above (from Step 1 to end)
-- 2. Open Supabase Dashboard: https://app.supabase.com
-- 3. Select project: zbwtsxowegvtbmpkuvpp
-- 4. Go to SQL Editor (left sidebar)
-- 5. Paste SQL and click "Run"
-- 6. Refresh your app and try import again
-- =============================================
