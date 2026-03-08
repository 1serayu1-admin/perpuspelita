
-- =============================================
-- FIX: Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- =============================================

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

-- =============================================
-- RECREATE as PERMISSIVE policies
-- =============================================

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

-- =============================================
-- AUTO-ASSIGN: First user becomes global_super_admin
-- Others get 'siswa' as default role
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

-- Recreate trigger (drop first since it references auth schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
