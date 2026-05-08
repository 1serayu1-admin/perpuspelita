-- =============================================
-- SAFE MIGRATION FIX - PRODUCTION SAFE
-- Run this in Supabase SQL Editor
-- This script is 100% idempotent and safe for existing data
-- =============================================

-- STEP 1: Ensure schools table exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') THEN
        CREATE TABLE public.schools (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            logo_url text,
            address text,
            phone text,
            email text,
            motto text,
            vision text,
            primary_color text DEFAULT '#0369a1',
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created schools table';
    END IF;
END $$;

-- STEP 2: Create tables without school_id first, then add column safely
DO $$
BEGIN
    -- Classes table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classes') THEN
        CREATE TABLE public.classes (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            major text NOT NULL DEFAULT '',
            homeroom_teacher text NOT NULL DEFAULT '',
            student_count int NOT NULL DEFAULT 0,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created classes table';
    END IF;
    
    -- Add school_id to classes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'school_id') THEN
        ALTER TABLE public.classes ADD COLUMN school_id uuid;
        RAISE NOTICE 'Added school_id to classes table';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'classes' AND constraint_name = 'classes_school_id_fkey') THEN
        ALTER TABLE public.classes ADD CONSTRAINT classes_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to classes.school_id';
    END IF;
END $$;

DO $$
BEGIN
    -- Students table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        CREATE TABLE public.students (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
            name text NOT NULL,
            nis text NOT NULL DEFAULT '',
            class_id uuid,
            major text NOT NULL DEFAULT '',
            email text NOT NULL DEFAULT '',
            is_active boolean NOT NULL DEFAULT true,
            membership_start date,
            membership_end date,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created students table';
    END IF;
    
    -- Add school_id to students if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'school_id') THEN
        ALTER TABLE public.students ADD COLUMN school_id uuid;
        RAISE NOTICE 'Added school_id to students table';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'students' AND constraint_name = 'students_school_id_fkey') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to students.school_id';
    END IF;
    
    -- Add class_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'students' AND constraint_name = 'students_class_id_fkey') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey 
            FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key to students.class_id';
    END IF;
END $$;

DO $$
BEGIN
    -- Teachers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teachers') THEN
        CREATE TABLE public.teachers (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
        RAISE NOTICE 'Created teachers table';
    END IF;
    
    -- Add school_id to teachers if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teachers' AND column_name = 'school_id') THEN
        ALTER TABLE public.teachers ADD COLUMN school_id uuid;
        RAISE NOTICE 'Added school_id to teachers table';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'teachers' AND constraint_name = 'teachers_school_id_fkey') THEN
        ALTER TABLE public.teachers ADD CONSTRAINT teachers_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to teachers.school_id';
    END IF;
END $$;

DO $$
BEGIN
    -- Borrow Requests table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'borrow_requests') THEN
        CREATE TABLE public.borrow_requests (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            requester_name text NOT NULL,
            requester_role text NOT NULL CHECK (requester_role IN ('siswa', 'guru')),
            book_id uuid,
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
        RAISE NOTICE 'Created borrow_requests table';
    END IF;
    
    -- Add school_id to borrow_requests if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'borrow_requests' AND column_name = 'school_id') THEN
        ALTER TABLE public.borrow_requests ADD COLUMN school_id uuid;
        RAISE NOTICE 'Added school_id to borrow_requests table';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrow_requests' AND constraint_name = 'borrow_requests_school_id_fkey') THEN
        ALTER TABLE public.borrow_requests ADD CONSTRAINT borrow_requests_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to borrow_requests.school_id';
    END IF;
    
    -- Add book_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrow_requests' AND constraint_name = 'borrow_requests_book_id_fkey') THEN
        ALTER TABLE public.borrow_requests ADD CONSTRAINT borrow_requests_book_id_fkey 
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key to borrow_requests.book_id';
    END IF;
END $$;

DO $$
BEGIN
    -- Borrowings table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'borrowings') THEN
        CREATE TABLE public.borrowings (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            type text NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'lesson')),
            borrower_name text NOT NULL,
            borrower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            book_id uuid,
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
        RAISE NOTICE 'Created borrowings table';
    END IF;
    
    -- Add school_id to borrowings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'borrowings' AND column_name = 'school_id') THEN
        ALTER TABLE public.borrowings ADD COLUMN school_id uuid;
        RAISE NOTICE 'Added school_id to borrowings table';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrowings' AND constraint_name = 'borrowings_school_id_fkey') THEN
        ALTER TABLE public.borrowings ADD CONSTRAINT borrowings_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to borrowings.school_id';
    END IF;
    
    -- Add book_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrowings' AND constraint_name = 'borrowings_book_id_fkey') THEN
        ALTER TABLE public.borrowings ADD CONSTRAINT borrowings_book_id_fkey 
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key to borrowings.book_id';
    END IF;
END $$;

DO $$
BEGIN
    -- Activity Logs table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
        CREATE TABLE public.activity_logs (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            action text NOT NULL,
            user_name text NOT NULL,
            detail text NOT NULL DEFAULT '',
            created_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created activity_logs table';
    END IF;
    
    -- Add school_id to activity_logs if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'school_id') THEN
        ALTER TABLE public.activity_logs ADD COLUMN school_id uuid;
        RAISE NOTICE 'Added school_id to activity_logs table';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'activity_logs' AND constraint_name = 'activity_logs_school_id_fkey') THEN
        ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to activity_logs.school_id';
    END IF;
END $$;

-- STEP 3: Create indexes safely
DO $$
BEGIN
    -- Classes indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_school_id') THEN
        CREATE INDEX idx_classes_school_id ON public.classes(school_id);
        RAISE NOTICE 'Created idx_classes_school_id';
    END IF;
    
    -- Students indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_school_id') THEN
        CREATE INDEX idx_students_school_id ON public.students(school_id);
        RAISE NOTICE 'Created idx_students_school_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_nis') THEN
        CREATE INDEX idx_students_nis ON public.students(nis);
        RAISE NOTICE 'Created idx_students_nis';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_name') THEN
        CREATE INDEX idx_students_name ON public.students(name);
        RAISE NOTICE 'Created idx_students_name';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_class_id') THEN
        CREATE INDEX idx_students_class_id ON public.students(class_id);
        RAISE NOTICE 'Created idx_students_class_id';
    END IF;
    
    -- Teachers indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_teachers_school_id') THEN
        CREATE INDEX idx_teachers_school_id ON public.teachers(school_id);
        RAISE NOTICE 'Created idx_teachers_school_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_teachers_nip') THEN
        CREATE INDEX idx_teachers_nip ON public.teachers(nip);
        RAISE NOTICE 'Created idx_teachers_nip';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_teachers_name') THEN
        CREATE INDEX idx_teachers_name ON public.teachers(name);
        RAISE NOTICE 'Created idx_teachers_name';
    END IF;
    
    -- Borrow Requests indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_borrow_requests_school_id') THEN
        CREATE INDEX idx_borrow_requests_school_id ON public.borrow_requests(school_id);
        RAISE NOTICE 'Created idx_borrow_requests_school_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_borrow_requests_requester_id') THEN
        CREATE INDEX idx_borrow_requests_requester_id ON public.borrow_requests(requester_id);
        RAISE NOTICE 'Created idx_borrow_requests_requester_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_borrow_requests_status') THEN
        CREATE INDEX idx_borrow_requests_status ON public.borrow_requests(status);
        RAISE NOTICE 'Created idx_borrow_requests_status';
    END IF;
    
    -- Borrowings indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_borrowings_school_id') THEN
        CREATE INDEX idx_borrowings_school_id ON public.borrowings(school_id);
        RAISE NOTICE 'Created idx_borrowings_school_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_borrowings_book_id') THEN
        CREATE INDEX idx_borrowings_book_id ON public.borrowings(book_id);
        RAISE NOTICE 'Created idx_borrowings_book_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_borrowings_borrower_id') THEN
        CREATE INDEX idx_borrowings_borrower_id ON public.borrowings(borrower_id);
        RAISE NOTICE 'Created idx_borrowings_borrower_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_borrowings_status') THEN
        CREATE INDEX idx_borrowings_status ON public.borrowings(status);
        RAISE NOTICE 'Created idx_borrowings_status';
    END IF;
    
    -- Activity Logs indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_logs_school_id') THEN
        CREATE INDEX idx_activity_logs_school_id ON public.activity_logs(school_id);
        RAISE NOTICE 'Created idx_activity_logs_school_id';
    END IF;
END $$;

-- STEP 4: Verification queries
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('classes', 'students', 'teachers', 'borrow_requests', 'borrowings', 'activity_logs')
AND column_name = 'school_id'
ORDER BY table_name;

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
