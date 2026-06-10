-- =============================================
-- ALL MIGRATIONS FOR PERPUPELITA
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- MIGRATION 1: 20260308152711_53a41ced-481f-4b1d-a8b9-681bbb563b65.sql
-- =============================================

-- ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('global_super_admin', 'school_super_admin', 'admin', 'guru', 'siswa');

-- HELPER: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- TABLE: schools (multi-tenant root)
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  motto TEXT,
  vision TEXT,
  primary_color TEXT DEFAULT '#0369a1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TABLE: profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TABLE: user_roles (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, school_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)

-- Check if user has a specific role (optionally within a school)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user has any of specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- Get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Check if user belongs to a specific school
CREATE OR REPLACE FUNCTION public.is_same_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND school_id = _school_id
  )
$$;

-- RLS POLICIES: schools

-- Global super admins can do everything with schools
CREATE POLICY "Global admins can manage all schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'global_super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_super_admin'));

-- School members can view their own school
CREATE POLICY "School members can view own school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (public.is_same_school(auth.uid(), id));

-- RLS POLICIES: profiles

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Global/school admins can view profiles in their school
CREATE POLICY "Admins can view school profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (
      public.has_role(auth.uid(), 'global_super_admin')
      OR public.is_same_school(auth.uid(), school_id)
    )
  );

-- Admins can insert profiles for their school
CREATE POLICY "Admins can insert school profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
  );

-- RLS POLICIES: user_roles

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Global super admins can manage all roles
CREATE POLICY "Global admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'global_super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_super_admin'));

-- School super admins can manage roles within their school
CREATE POLICY "School admins can view school roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'school_super_admin')
    AND public.is_same_school(auth.uid(), school_id)
  );

CREATE POLICY "School admins can insert school roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'school_super_admin')
    AND role != 'global_super_admin'
  );

-- TRIGGER: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INDEXES
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_school_id ON public.user_roles(school_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- =============================================
-- MIGRATION 2: 20260308153435_76b54075-d8be-49b5-9b9f-eeb0328d294f.sql
-- =============================================

-- FIX: Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- Drop profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view school profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert school profiles" ON public.profiles;

-- Drop schools policies
DROP POLICY IF EXISTS "Global admins can manage all schools" ON public.schools;
DROP POLICY IF EXISTS "School members can view own school" ON public.schools;

-- Drop user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Global admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "School admins can view school roles" ON public.user_roles;
DROP POLICY IF EXISTS "School admins can insert school roles" ON public.user_roles;

-- RECREATE as PERMISSIVE policies

-- profiles: SELECT
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view school profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (
      has_role(auth.uid(), 'global_super_admin')
      OR is_same_school(auth.uid(), school_id)
    )
  );

-- profiles: INSERT (for trigger + admin)
CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert school profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
  );

-- profiles: UPDATE
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update school profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (
      has_role(auth.uid(), 'global_super_admin')
      OR is_same_school(auth.uid(), school_id)
    )
  );

-- schools: SELECT
CREATE POLICY "Global admins can do all on schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'global_super_admin'))
  WITH CHECK (has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "School members can view own school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (is_same_school(auth.uid(), id));

-- user_roles: SELECT
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Global admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'global_super_admin'))
  WITH CHECK (has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "School admins can view school roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'school_super_admin')
    AND is_same_school(auth.uid(), school_id)
  );

CREATE POLICY "School admins can insert school roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'school_super_admin')
    AND role != 'global_super_admin'
  );

-- AUTO-ASSIGN: First user becomes global_super_admin
-- Others get 'siswa' as default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_count INT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );

  -- Check if this is the first user
  SELECT COUNT(*) INTO _user_count FROM public.user_roles;

  IF _user_count = 0 THEN
    -- First user becomes global_super_admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'global_super_admin');
  ELSE
    -- Default role is siswa
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'siswa');
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger (drop first since it references auth schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- MIGRATION 3: 20260308153548_5c52f7cf-85f3-4ea3-9807-d4a8e3e174d8.sql
-- =============================================

-- TABLE: categories (with school_id)
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_categories_school_id ON public.categories(school_id);

-- TABLE: books (with school_id)
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  publisher TEXT NOT NULL DEFAULT '',
  year INT NOT NULL DEFAULT 2024,
  isbn TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock INT NOT NULL DEFAULT 0,
  available INT NOT NULL DEFAULT 0,
  shelf_location TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_books_school_id ON public.books(school_id);
CREATE INDEX idx_books_title ON public.books(title);
CREATE INDEX idx_books_isbn ON public.books(isbn);
CREATE INDEX idx_books_category_id ON public.books(category_id);

-- TABLE: classes (with school_id)
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  major TEXT NOT NULL DEFAULT '',
  homeroom_teacher TEXT NOT NULL DEFAULT '',
  student_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_classes_school_id ON public.classes(school_id);

-- TABLE: students (with school_id)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  nis TEXT NOT NULL DEFAULT '',
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  major TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  membership_start DATE,
  membership_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_students_nis ON public.students(nis);
CREATE INDEX idx_students_name ON public.students(name);
CREATE INDEX idx_students_class_id ON public.students(class_id);

-- TABLE: teachers (with school_id)
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  nip TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  membership_start DATE,
  membership_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX idx_teachers_nip ON public.teachers(nip);
CREATE INDEX idx_teachers_name ON public.teachers(name);

-- TABLE: borrow_requests (with school_id)
CREATE TABLE public.borrow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_role TEXT NOT NULL CHECK (requester_role IN ('siswa', 'guru')),
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  book_title TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  class_name TEXT,
  duration INT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_borrow_requests_updated_at
  BEFORE UPDATE ON public.borrow_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_borrow_requests_school_id ON public.borrow_requests(school_id);
CREATE INDEX idx_borrow_requests_requester_id ON public.borrow_requests(requester_id);
CREATE INDEX idx_borrow_requests_status ON public.borrow_requests(status);

-- TABLE: borrowings (with school_id)
CREATE TABLE public.borrowings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'lesson')),
  borrower_name TEXT NOT NULL,
  borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  book_title TEXT NOT NULL,
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'late')),
  class_name TEXT,
  subject TEXT,
  teacher_name TEXT,
  duration INT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_borrowings_updated_at
  BEFORE UPDATE ON public.borrowings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_borrowings_school_id ON public.borrowings(school_id);
CREATE INDEX idx_borrowings_book_id ON public.borrowings(book_id);
CREATE INDEX idx_borrowings_borrower_id ON public.borrowings(borrower_id);
CREATE INDEX idx_borrowings_status ON public.borrowings(status);

-- TABLE: activity_logs (with school_id)
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_name TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_activity_logs_school_id ON public.activity_logs(school_id);

-- RLS POLICIES for all new tables
-- Pattern: admins in same school can CRUD, members can read

-- categories
CREATE POLICY "School members can view categories"
  ON public.categories FOR SELECT TO authenticated
  USING (is_same_school(auth.uid(), school_id) OR has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- books
CREATE POLICY "School members can view books"
  ON public.books FOR SELECT TO authenticated
  USING (is_same_school(auth.uid(), school_id) OR has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "Admins can manage books"
  ON public.books FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- classes
CREATE POLICY "School members can view classes"
  ON public.classes FOR SELECT TO authenticated
  USING (is_same_school(auth.uid(), school_id) OR has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- students
CREATE POLICY "School members can view students"
  ON public.students FOR SELECT TO authenticated
  USING (is_same_school(auth.uid(), school_id) OR has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- teachers
CREATE POLICY "School members can view teachers"
  ON public.teachers FOR SELECT TO authenticated
  USING (is_same_school(auth.uid(), school_id) OR has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- borrow_requests
CREATE POLICY "Users can view own borrow requests"
  ON public.borrow_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id);

CREATE POLICY "Users can create borrow requests"
  ON public.borrow_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Admins can view school borrow requests"
  ON public.borrow_requests FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

CREATE POLICY "Admins can update borrow requests"
  ON public.borrow_requests FOR UPDATE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- borrowings
CREATE POLICY "Users can view own borrowings"
  ON public.borrowings FOR SELECT TO authenticated
  USING (auth.uid() = borrower_id);

CREATE POLICY "Admins can manage borrowings"
  ON public.borrowings FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- activity_logs
CREATE POLICY "Admins can view school activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

CREATE POLICY "Admins can insert activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
  );

-- =============================================
-- MIGRATION 4: 20260308154455_9aa52398-bb18-4bb5-92e1-bdfbedf04c38.sql
-- =============================================

-- Allow school_super_admin to UPDATE roles within their school (not global_super_admin role)
CREATE POLICY "School admins can update school roles"
ON public.user_roles FOR UPDATE
USING (
  has_role(auth.uid(), 'school_super_admin'::app_role)
  AND is_same_school(auth.uid(), school_id)
  AND role <> 'global_super_admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'school_super_admin'::app_role)
  AND role <> 'global_super_admin'::app_role
);

-- Allow school_super_admin to DELETE roles within their school
CREATE POLICY "School admins can delete school roles"
ON public.user_roles FOR DELETE
USING (
  has_role(auth.uid(), 'school_super_admin'::app_role)
  AND is_same_school(auth.uid(), school_id)
  AND role <> 'global_super_admin'::app_role
);

-- =============================================
-- MIGRATION 5: 20260308173942_bc80cd39-90ae-4ff6-a7d0-103082d7e773.sql
-- =============================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS ip_access_mode text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS allowed_ips text[] NOT NULL DEFAULT '{}';

-- =============================================
-- MIGRATION 6: 20260308184030_b31a1410-b888-480e-907c-d2afe5d76c88.sql
-- =============================================

-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- Create function to get email by username (for login)
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE username = _username LIMIT 1
$$;

-- =============================================
-- MIGRATION 7: 20260308214636_d02d32ac-15e0-4ce7-9685-31fb7cda9307.sql
-- =============================================

-- Atomic function to decrement book available count safely
CREATE OR REPLACE FUNCTION public.decrement_book_available(_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected int;
BEGIN
  UPDATE public.books
  SET available = available - 1, updated_at = now()
  WHERE id = _book_id AND available > 0;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- Atomic function to increment book available count safely
CREATE OR REPLACE FUNCTION public.increment_book_available(_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected int;
BEGIN
  UPDATE public.books
  SET available = available + 1, updated_at = now()
  WHERE id = _book_id AND available < stock;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- =============================================
-- MIGRATION 8: 20260324012125_29103cf1-4b52-4c61-b30d-6e839c118d60.sql
-- =============================================

-- 1. Create security_logs table
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  ip_address text NOT NULL DEFAULT 'unknown',
  device_fingerprint text,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  detail text DEFAULT '',
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global admins can view all security logs" ON public.security_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'global_super_admin'::app_role));

CREATE POLICY "School admins can view school security logs" ON public.security_logs
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['school_super_admin'::app_role, 'admin'::app_role]) AND is_same_school(auth.uid(), school_id));

CREATE POLICY "System can insert security logs" ON public.security_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can insert security logs" ON public.security_logs
  FOR INSERT TO anon
  WITH CHECK (true);

-- 2. Create authorized_devices table
CREATE TABLE public.authorized_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name text NOT NULL DEFAULT 'Unknown Device',
  fingerprint text NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  is_approved boolean NOT NULL DEFAULT false,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id, fingerprint)
);

ALTER TABLE public.authorized_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices" ON public.authorized_devices
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can view school devices" ON public.authorized_devices
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role]) AND (has_role(auth.uid(), 'global_super_admin'::app_role) OR is_same_school(auth.uid(), school_id)));

CREATE POLICY "Users can insert own devices" ON public.authorized_devices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Admins can update devices" ON public.authorized_devices
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role]) AND (has_role(auth.uid(), 'global_super_admin'::app_role) OR is_same_school(auth.uid(), school_id)));

CREATE POLICY "Admins can delete devices" ON public.authorized_devices
  FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role]) AND (has_role(auth.uid(), 'global_super_admin'::app_role) OR is_same_school(auth.uid(), school_id)));

-- 3. Create backup_history table
CREATE TABLE public.backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  backup_type text NOT NULL DEFAULT 'manual',
  backup_size text,
  backup_status text NOT NULL DEFAULT 'completed',
  backup_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup history" ON public.backup_history
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role]) AND (has_role(auth.uid(), 'global_super_admin'::app_role) OR is_same_school(auth.uid(), school_id)));

CREATE POLICY "Admins can insert backup history" ON public.backup_history
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role]));

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books(title);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_school_id ON public.books(school_id);

CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(name);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);

CREATE INDEX IF NOT EXISTS idx_teachers_nip ON public.teachers(nip);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON public.teachers(name);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);

CREATE INDEX IF NOT EXISTS idx_borrowings_book_id ON public.borrowings(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_borrower_id ON public.borrowings(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON public.borrowings(status);
CREATE INDEX IF NOT EXISTS idx_borrowings_school_id ON public.borrowings(school_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_school_id ON public.security_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_authorized_devices_owner ON public.authorized_devices(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_authorized_devices_fingerprint ON public.authorized_devices(fingerprint);

CREATE INDEX IF NOT EXISTS idx_activity_logs_school_id ON public.activity_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON public.user_roles(school_id);

CREATE INDEX IF NOT EXISTS idx_borrow_requests_school_id ON public.borrow_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON public.borrow_requests(status);

CREATE INDEX IF NOT EXISTS idx_categories_school_id ON public.categories(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);

-- =============================================
-- MIGRATION 9: 20260324012148_2d5226cb-db76-4471-a567-d8a5d2a35904.sql
-- =============================================

-- Fix overly permissive RLS policies on security_logs
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Anon can insert security logs" ON public.security_logs;

-- Authenticated users can only insert logs for themselves
CREATE POLICY "Authenticated can insert own security logs" ON public.security_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Create a security definer function for edge functions to insert security logs
CREATE OR REPLACE FUNCTION public.insert_security_log(
  _user_email text,
  _ip_address text,
  _device_fingerprint text,
  _action text,
  _status text,
  _detail text,
  _school_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (user_email, ip_address, device_fingerprint, action, status, detail, school_id)
  VALUES (_user_email, _ip_address, _device_fingerprint, _action, _status, _detail, _school_id);
END;
$$;

-- =============================================
-- MIGRATION 10: 20260507000000_ai_quotas.sql
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_quotas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_limit integer NOT NULL DEFAULT 10,
    questions_used integer NOT NULL DEFAULT 0,
    last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.ai_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quota" ON public.ai_quotas
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.decrement_ai_quota(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quota public.ai_quotas;
    v_today date := CURRENT_DATE;
BEGIN
    SELECT * INTO v_quota FROM public.ai_quotas WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.ai_quotas (user_id, daily_limit, questions_used, last_reset_date)
        VALUES (p_user_id, 10, 1, v_today)
        RETURNING * INTO v_quota;
        
        RETURN json_build_object('success', true, 'remaining', v_quota.daily_limit - v_quota.questions_used);
    END IF;

    IF v_quota.last_reset_date < v_today THEN
        UPDATE public.ai_quotas 
        SET questions_used = 1, last_reset_date = v_today, updated_at = now()
        WHERE id = v_quota.id
        RETURNING * INTO v_quota;
        
        RETURN json_build_object('success', true, 'remaining', v_quota.daily_limit - v_quota.questions_used);
    END IF;

    IF v_quota.questions_used >= v_quota.daily_limit THEN
        RETURN json_build_object('success', false, 'error', 'Quota exceeded');
    END IF;

    UPDATE public.ai_quotas 
    SET questions_used = questions_used + 1, updated_at = now()
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;

    RETURN json_build_object('success', true, 'remaining', v_quota.daily_limit - v_quota.questions_used);
END;
$$;
