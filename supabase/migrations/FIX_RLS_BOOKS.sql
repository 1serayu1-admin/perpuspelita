-- =============================================
-- FIX RLS FOR BOOKS & CATEGORIES TABLES
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- FIX 1: books TABLE
-- =============================================
DROP POLICY IF EXISTS "Books viewable by school" ON public.books;
DROP POLICY IF EXISTS "Books manageable by admin" ON public.books;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.books;
DROP POLICY IF EXISTS "Enable all for authenticated on books" ON public.books;
DROP POLICY IF EXISTS "Enable read for anon on books" ON public.books;

ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated on books"
ON public.books
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable read for anon on books"
ON public.books
FOR SELECT
TO anon
USING (true);

GRANT ALL ON public.books TO authenticated;
GRANT SELECT ON public.books TO anon;


-- =============================================
-- FIX 2: categories TABLE
-- =============================================
DROP POLICY IF EXISTS "Categories viewable by school" ON public.categories;
DROP POLICY IF EXISTS "Categories manageable by admin" ON public.categories;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.categories;
DROP POLICY IF EXISTS "Enable all for authenticated on categories" ON public.categories;
DROP POLICY IF EXISTS "Enable read for anon on categories" ON public.categories;

ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated on categories"
ON public.categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable read for anon on categories"
ON public.categories
FOR SELECT
TO anon
USING (true);

GRANT ALL ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;


-- =============================================
-- VERIFICATION
-- =============================================
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('books', 'categories');
