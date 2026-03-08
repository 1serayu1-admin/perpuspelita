
-- =============================================
-- TABLE: categories (with school_id)
-- =============================================
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

-- =============================================
-- TABLE: books (with school_id)
-- =============================================
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

-- =============================================
-- TABLE: classes (with school_id)
-- =============================================
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

-- =============================================
-- TABLE: students (with school_id)
-- =============================================
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

-- =============================================
-- TABLE: teachers (with school_id)
-- =============================================
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

-- =============================================
-- TABLE: borrow_requests (with school_id)
-- =============================================
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

-- =============================================
-- TABLE: borrowings (with school_id)
-- =============================================
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

-- =============================================
-- TABLE: activity_logs (with school_id)
-- =============================================
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

-- =============================================
-- RLS POLICIES for all new tables
-- Pattern: admins in same school can CRUD, members can read
-- =============================================

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
