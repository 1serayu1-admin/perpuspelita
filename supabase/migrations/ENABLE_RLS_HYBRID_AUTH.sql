-- =============================================
-- ENABLE RLS untuk HYBRID AUTH (Supabase + localStorage)
-- Supports both authenticated and legacy localStorage users
-- =============================================

-- =============================================
-- 1. TEACHERS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers public read" ON public.teachers;
DROP POLICY IF EXISTS "Teachers admin write" ON public.teachers;
DROP POLICY IF EXISTS "teachers viewable by school" ON public.teachers;
DROP POLICY IF EXISTS "teachers insertable by admin" ON public.teachers;
DROP POLICY IF EXISTS "teachers updatable by admin" ON public.teachers;
DROP POLICY IF EXISTS "teachers deletable by admin" ON public.teachers;
DROP POLICY IF EXISTS "Enable all for authenticated on teachers" ON public.teachers;

-- Enable RLS
ALTER TABLE IF EXISTS public.teachers ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "Teachers public read"
ON public.teachers
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "Teachers admin write"
ON public.teachers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.teachers TO authenticated;
GRANT SELECT ON public.teachers TO anon;

-- =============================================
-- 2. STUDENTS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students public read" ON public.students;
DROP POLICY IF EXISTS "Students admin write" ON public.students;
DROP POLICY IF EXISTS "students viewable by school" ON public.students;
DROP POLICY IF EXISTS "students insertable by admin" ON public.students;
DROP POLICY IF EXISTS "students updatable by admin" ON public.students;
DROP POLICY IF EXISTS "students deletable by admin" ON public.students;
DROP POLICY IF EXISTS "Enable all for authenticated on students" ON public.students;

-- Enable RLS
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "Students public read"
ON public.students
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "Students admin write"
ON public.students
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.students TO authenticated;
GRANT SELECT ON public.students TO anon;

-- =============================================
-- 3. BOOKS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Books public read" ON public.books;
DROP POLICY IF EXISTS "Books admin write" ON public.books;
DROP POLICY IF EXISTS "books viewable by all" ON public.books;
DROP POLICY IF EXISTS "books insertable by admin" ON public.books;
DROP POLICY IF EXISTS "books updatable by admin" ON public.books;
DROP POLICY IF EXISTS "books deletable by admin" ON public.books;
DROP POLICY IF EXISTS "Enable all for authenticated on books" ON public.books;

-- Enable RLS
ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "Books public read"
ON public.books
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "Books admin write"
ON public.books
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.books TO authenticated;
GRANT SELECT ON public.books TO anon;

-- =============================================
-- 4. CATEGORIES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Categories public read" ON public.categories;
DROP POLICY IF EXISTS "Categories admin write" ON public.categories;
DROP POLICY IF EXISTS "categories viewable by all" ON public.categories;
DROP POLICY IF EXISTS "categories insertable by admin" ON public.categories;
DROP POLICY IF EXISTS "categories updatable by admin" ON public.categories;
DROP POLICY IF EXISTS "categories deletable by admin" ON public.categories;
DROP POLICY IF EXISTS "Enable all for authenticated on categories" ON public.categories;

-- Enable RLS
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "Categories public read"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "Categories admin write"
ON public.categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;

-- =============================================
-- 5. BORROWINGS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Borrowings public read" ON public.borrowings;
DROP POLICY IF EXISTS "Borrowings admin write" ON public.borrowings;
DROP POLICY IF EXISTS "borrowings viewable by school" ON public.borrowings;
DROP POLICY IF EXISTS "borrowings insertable by admin" ON public.borrowings;
DROP POLICY IF EXISTS "borrowings updatable by admin" ON public.borrowings;
DROP POLICY IF EXISTS "borrowings deletable by admin" ON public.borrowings;
DROP POLICY IF EXISTS "Enable all for authenticated on borrowings" ON public.borrowings;

-- Enable RLS
ALTER TABLE IF EXISTS public.borrowings ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "Borrowings public read"
ON public.borrowings
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "Borrowings admin write"
ON public.borrowings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.borrowings TO authenticated;
GRANT SELECT ON public.borrowings TO anon;

-- =============================================
-- 6. SCHOOLS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Schools public read" ON public.schools;
DROP POLICY IF EXISTS "Schools admin write" ON public.schools;
DROP POLICY IF EXISTS "schools viewable by all" ON public.schools;
DROP POLICY IF EXISTS "schools insertable by admin" ON public.schools;
DROP POLICY IF EXISTS "schools updatable by admin" ON public.schools;
DROP POLICY IF EXISTS "schools deletable by admin" ON public.schools;
DROP POLICY IF EXISTS "Enable all for authenticated on schools" ON public.schools;

-- Enable RLS
ALTER TABLE IF EXISTS public.schools ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "Schools public read"
ON public.schools
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "Schools admin write"
ON public.schools
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.schools TO authenticated;
GRANT SELECT ON public.schools TO anon;

-- =============================================
-- 7. USER_ROLES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "user_roles viewable by self or admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles insertable by admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles updatable by admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles deletable by admin" ON public.user_roles;
DROP POLICY IF EXISTS "Enable all for authenticated on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read for anon on user_roles" ON public.user_roles;

-- Enable RLS
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "user_roles public read"
ON public.user_roles
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "user_roles admin write"
ON public.user_roles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;

-- =============================================
-- 8. PROFILES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "profiles viewable by self or school" ON public.profiles;
DROP POLICY IF EXISTS "profiles insertable by self" ON public.profiles;
DROP POLICY IF EXISTS "profiles updatable by self" ON public.profiles;
DROP POLICY IF EXISTS "profiles deletable by admin" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for anon on profiles" ON public.profiles;

-- Enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Public read (for localStorage fallback users)
CREATE POLICY "profiles public read"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Write restricted to authenticated users
CREATE POLICY "profiles admin write"
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =============================================
-- VERIFY STATUS
-- =============================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('teachers', 'students', 'borrowings', 'books', 'categories', 'schools', 'user_roles', 'profiles')
ORDER BY tablename;
