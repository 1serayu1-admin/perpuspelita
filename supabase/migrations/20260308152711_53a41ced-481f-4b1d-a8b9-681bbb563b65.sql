
-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('global_super_admin', 'school_super_admin', 'admin', 'guru', 'siswa');

-- =============================================
-- HELPER: update_updated_at_column
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- TABLE: schools (multi-tenant root)
-- =============================================
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

-- =============================================
-- TABLE: profiles (linked to auth.users)
-- =============================================
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

-- =============================================
-- TABLE: user_roles (separate from profiles!)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, school_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- =============================================

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

-- =============================================
-- RLS POLICIES: schools
-- =============================================

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

-- =============================================
-- RLS POLICIES: profiles
-- =============================================

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

-- =============================================
-- RLS POLICIES: user_roles
-- =============================================

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

-- =============================================
-- TRIGGER: auto-create profile on signup
-- =============================================
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

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_school_id ON public.user_roles(school_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
