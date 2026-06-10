-- =====================================================
-- DISABLE RLS untuk table yang perlu diakses tanpa JWT
-- Karena kita pakai Hardcoded Auth (tanpa Supabase Auth)
-- =====================================================

-- Disable RLS pada table teachers (agar bisa insert dari hardcoded auth)
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;

-- Disable RLS pada table students (agar bisa insert dari hardcoded auth)  
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- Disable RLS pada table borrowings
ALTER TABLE public.borrowings DISABLE ROW LEVEL SECURITY;

-- Disable RLS pada table books
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- Disable RLS pada table categories
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Disable RLS pada table schools
ALTER TABLE public.schools DISABLE ROW LEVEL SECURITY;

-- Disable RLS pada table user_roles (jika masih dipakai)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verify status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('teachers', 'students', 'borrowings', 'books', 'categories', 'schools', 'user_roles');
