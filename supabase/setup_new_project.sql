-- =============================================
-- SETUP PROJECT BARU: ajmmyxeyqjzkdtqsyqrc
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- =============================================
-- 1. EXTENSIONS
-- =============================================
extension if not exists "uuid-ossp";

-- =============================================
-- 2. ENUMS
-- =============================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum (
      'global_super_admin',
      'school_super_admin',
      'admin',
      'guru',
      'siswa'
    );
  end if;
end
$$;

-- =============================================
-- 3. HELPER FUNCTIONS
-- =============================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

-- Check if user belongs to same school
CREATE OR REPLACE FUNCTION public.is_same_school(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND school_id = _school_id
  );
$$;

-- Auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================
-- 4. TABLES
-- =============================================

-- Schools
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  motto text,
  vision text,
  logo_url text,
  primary_color text DEFAULT '#0369a1',
  allowed_ips text[] DEFAULT '{}',
  ip_access_mode text DEFAULT 'allow_all',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  username text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Books
CREATE TABLE IF NOT EXISTS public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  publisher text NOT NULL DEFAULT '',
  year int NOT NULL DEFAULT 2024,
  isbn text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  stock int NOT NULL DEFAULT 0,
  available int NOT NULL DEFAULT 0,
  shelf_location text NOT NULL DEFAULT '',
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  major text NOT NULL DEFAULT '',
  homeroom_teacher text NOT NULL DEFAULT '',
  student_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Students
CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  nis text NOT NULL DEFAULT '',
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  major text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  membership_start date,
  membership_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  nip text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  membership_start date,
  membership_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Borrow Requests
CREATE TABLE IF NOT EXISTS public.borrow_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name text NOT NULL,
  requester_role text NOT NULL CHECK (requester_role IN ('siswa', 'guru')),
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  book_title text NOT NULL,
  reason text NOT NULL DEFAULT '',
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  class_name text,
  duration int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;

-- Borrowings
CREATE TABLE IF NOT EXISTS public.borrowings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'lesson')),
  borrower_name text NOT NULL,
  borrower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  book_title text NOT NULL,
  borrow_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  status text NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'late')),
  class_name text,
  subject text,
  teacher_name text,
  duration int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  action text NOT NULL,
  user_name text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security Logs
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  user_id uuid,
  user_email text,
  ip_address text NOT NULL,
  device_fingerprint text,
  action text NOT NULL,
  status text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Backup History
CREATE TABLE IF NOT EXISTS public.backup_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  backup_type text NOT NULL,
  backup_status text NOT NULL,
  backup_url text,
  backup_size text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Authorized Devices
CREATE TABLE IF NOT EXISTS public.authorized_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  fingerprint text NOT NULL,
  device_name text,
  is_approved boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id, fingerprint)
);

ALTER TABLE public.authorized_devices ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- Schools
CREATE POLICY "Global admins can do all on schools"
  ON public.schools FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'global_super_admin'))
  WITH CHECK (has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "School members can view own school"
  ON public.schools FOR SELECT TO authenticated
  USING (is_same_school(auth.uid(), id));

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view school profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert school profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update school profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

-- User Roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Global admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'global_super_admin'))
  WITH CHECK (has_role(auth.uid(), 'global_super_admin'));

CREATE POLICY "School admins can view school roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'school_super_admin')
    AND is_same_school(auth.uid(), school_id)
  );

CREATE POLICY "School admins can insert school roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'school_super_admin')
    AND role != 'global_super_admin'
  );

-- Categories, Books, Classes, Students, Teachers (same pattern)
DO $$
DECLARE
  tables text[] := ARRAY['categories', 'books', 'classes', 'students', 'teachers'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      CREATE POLICY "School members can view %1$s"
        ON public.%1$s FOR SELECT TO authenticated
        USING (is_same_school(auth.uid(), school_id) OR has_role(auth.uid(), ''global_super_admin''));

      CREATE POLICY "Admins can manage %1$s"
        ON public.%1$s FOR ALL TO authenticated
        USING (
          has_any_role(auth.uid(), ARRAY[''global_super_admin''::app_role, ''school_super_admin''::app_role, ''admin''::app_role])
          AND (has_role(auth.uid(), ''global_super_admin'') OR is_same_school(auth.uid(), school_id))
        )
        WITH CHECK (
          has_any_role(auth.uid(), ARRAY[''global_super_admin''::app_role, ''school_super_admin''::app_role, ''admin''::app_role])
          AND (has_role(auth.uid(), ''global_super_admin'') OR is_same_school(auth.uid(), school_id))
        );
    ', t);
  END LOOP;
END
$$;

-- Borrow Requests
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

-- Borrowings
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

-- Activity Logs
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

-- Security Logs
CREATE POLICY "Admins can view security logs"
  ON public.security_logs FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

CREATE POLICY "System can insert security logs"
  ON public.security_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Backup History
CREATE POLICY "Admins can view backup history"
  ON public.backup_history FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
    AND (has_role(auth.uid(), 'global_super_admin') OR is_same_school(auth.uid(), school_id))
  );

CREATE POLICY "Admins can insert backup history"
  ON public.backup_history FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['global_super_admin'::app_role, 'school_super_admin'::app_role, 'admin'::app_role])
  );

-- Authorized Devices
CREATE POLICY "Users can view own devices"
  ON public.authorized_devices FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "System can insert devices"
  ON public.authorized_devices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own devices"
  ON public.authorized_devices FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id);

-- =============================================
-- 6. TRIGGERS
-- =============================================

-- Auto update updated_at
CREATE OR REPLACE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_borrow_requests_updated_at
  BEFORE UPDATE ON public.borrow_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_borrowings_updated_at
  BEFORE UPDATE ON public.borrowings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_authorized_devices_updated_at
  BEFORE UPDATE ON public.authorized_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 7. AUTO-ASSIGN FIRST USER AS GLOBAL_SUPER_ADMIN
-- =============================================
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

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 8. BOOK STOCK FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.decrement_book_available(_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.books
  SET available = available - 1
  WHERE id = _book_id AND available > 0;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_book_available(_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.books
  SET available = available + 1
  WHERE id = _book_id;
  RETURN FOUND;
END;
$$;

-- =============================================
-- 9. INSERT SAMPLE SCHOOL (OPTIONAL)
-- =============================================
-- Uncomment to create default school:
-- INSERT INTO public.schools (name, address, email, motto, vision)
-- VALUES (
--   'SMA Negeri 1 Contoh',
--   'Jl. Pendidikan No. 1',
--   'sman1@contoh.sch.id',
--   'Maju bersama, hebat semua',
--   'Menciptakan generasi unggul'
-- );

-- =============================================
-- 10. DONE!
-- =============================================
-- User pertama yang signup akan otomatis jadi Global Super Admin
-- Setup selesai, aplikasi siap digunakan!
