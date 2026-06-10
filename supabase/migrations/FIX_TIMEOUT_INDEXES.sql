-- =============================================
-- FIX TIMEOUT ERRORS - Add indexes for faster queries
-- This fixes "getUserRole fail: Error: timeout"
-- =============================================

-- Add index on user_roles.user_id for faster role lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Add index on user_roles.role for faster filtering
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Add index on students.nis for duplicate checking
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);

-- Add index on students.school_id for faster school filtering
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);

-- Add index on profiles.user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Verify indexes created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'students', 'profiles');
