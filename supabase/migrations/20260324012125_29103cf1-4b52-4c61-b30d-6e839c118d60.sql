
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
