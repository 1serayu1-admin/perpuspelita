-- =============================================
-- SYNC MISSING TABLES - SAFE SCHEMA FIX
-- Run this in Supabase SQL Editor to create any missing tables
-- =============================================

-- Check and create missing tables with IF NOT EXISTS

-- Classes (if missing)
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

-- Students (if missing)
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

-- Teachers (if missing)
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

-- Borrow Requests (if missing)
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

-- Borrowings (if missing)
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

-- Activity Logs (if missing)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  action text NOT NULL,
  user_name text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE INDEXES (if missing)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(name);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_nip ON public.teachers(nip);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON public.teachers(name);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_school_id ON public.borrow_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_requester_id ON public.borrow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON public.borrow_requests(status);
CREATE INDEX IF NOT EXISTS idx_borrowings_school_id ON public.borrowings(school_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_book_id ON public.borrowings(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_borrower_id ON public.borrowings(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON public.borrowings(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_school_id ON public.activity_logs(school_id);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check all required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'classes', 'students', 'teachers', 
    'borrow_requests', 'borrowings', 'activity_logs'
)
ORDER BY table_name;

-- Check row counts
SELECT 
    'classes' as table_name, COUNT(*) as row_count FROM public.classes
UNION ALL
SELECT 
    'students' as table_name, COUNT(*) as row_count FROM public.students
UNION ALL
SELECT 
    'teachers' as table_name, COUNT(*) as row_count FROM public.teachers
UNION ALL
SELECT 
    'borrow_requests' as table_name, COUNT(*) as row_count FROM public.borrow_requests
UNION ALL
SELECT 
    'borrowings' as table_name, COUNT(*) as row_count FROM public.borrowings
UNION ALL
SELECT 
    'activity_logs' as table_name, COUNT(*) as row_count FROM public.activity_logs
ORDER BY table_name;
