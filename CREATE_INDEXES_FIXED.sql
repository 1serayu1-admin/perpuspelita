-- =============================================
-- CREATE INDEXES TO FIX TIMEOUT ISSUES (FIXED VERSION)
-- Run this in Supabase SQL Editor
-- =============================================

-- Index utama untuk mempercepat getUserRole (query paling sering timeout)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON public.user_roles(user_id, role, school_id);

-- Index untuk profiles (jika sering di-join dengan user_roles)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);

-- Index untuk books (mempercepat query buku)
CREATE INDEX IF NOT EXISTS idx_books_title 
ON public.books(title);

CREATE INDEX IF NOT EXISTS idx_books_school_id 
ON public.books(school_id);

CREATE INDEX IF NOT EXISTS idx_books_category_id 
ON public.books(category_id);

-- Index untuk categories
CREATE INDEX IF NOT EXISTS idx_categories_name_school 
ON public.categories(name, school_id);

-- Index untuk students (mempercepat pencarian siswa)
CREATE INDEX IF NOT EXISTS idx_students_nis 
ON public.students(nis);

CREATE INDEX IF NOT EXISTS idx_students_name 
ON public.students(name);

-- Index untuk teachers
CREATE INDEX IF NOT EXISTS idx_teachers_nip 
ON public.teachers(nip);

CREATE INDEX IF NOT EXISTS idx_teachers_name 
ON public.teachers(name);

-- Index untuk auth.users (jika di-join dengan public tables)
CREATE INDEX IF NOT EXISTS idx_auth_users_email 
ON auth.users(email);

-- =============================================
-- VERIFICATION: Check if indexes are created
-- =============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'profiles', 'books', 'categories', 'students', 'teachers')
ORDER BY tablename, indexname;
