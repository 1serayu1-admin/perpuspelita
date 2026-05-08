-- =============================================
-- PHASE 3: ENHANCEMENT LAYER
-- RUN ONLY AFTER FOUNDATION SCHEMA IS STABLE
-- Adds: indexes, foreign keys, RLS, policies
-- =============================================

-- STEP 1: Add Foreign Keys (after columns exist)
DO $$
BEGIN
    -- Categories FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'categories' AND constraint_name = 'categories_school_id_fkey') THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added categories.school_id FK';
    END IF;
    
    -- Books FKs
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'books' AND constraint_name = 'books_school_id_fkey') THEN
        ALTER TABLE public.books ADD CONSTRAINT books_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added books.school_id FK';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'books' AND constraint_name = 'books_category_id_fkey') THEN
        ALTER TABLE public.books ADD CONSTRAINT books_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added books.category_id FK';
    END IF;
    
    -- Classes FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'classes' AND constraint_name = 'classes_school_id_fkey') THEN
        ALTER TABLE public.classes ADD CONSTRAINT classes_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added classes.school_id FK';
    END IF;
    
    -- Students FKs
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'students' AND constraint_name = 'students_school_id_fkey') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added students.school_id FK';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'students' AND constraint_name = 'students_class_id_fkey') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey 
            FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added students.class_id FK';
    END IF;
    
    -- Teachers FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'teachers' AND constraint_name = 'teachers_school_id_fkey') THEN
        ALTER TABLE public.teachers ADD CONSTRAINT teachers_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added teachers.school_id FK';
    END IF;
    
    -- Borrow Requests FKs
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrow_requests' AND constraint_name = 'borrow_requests_school_id_fkey') THEN
        ALTER TABLE public.borrow_requests ADD CONSTRAINT borrow_requests_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added borrow_requests.school_id FK';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrow_requests' AND constraint_name = 'borrow_requests_book_id_fkey') THEN
        ALTER TABLE public.borrow_requests ADD CONSTRAINT borrow_requests_book_id_fkey 
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added borrow_requests.book_id FK';
    END IF;
    
    -- Borrowings FKs
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrowings' AND constraint_name = 'borrowings_school_id_fkey') THEN
        ALTER TABLE public.borrowings ADD CONSTRAINT borrowings_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added borrowings.school_id FK';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'borrowings' AND constraint_name = 'borrowings_book_id_fkey') THEN
        ALTER TABLE public.borrowings ADD CONSTRAINT borrowings_book_id_fkey 
            FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added borrowings.book_id FK';
    END IF;
    
    -- Activity Logs FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'activity_logs' AND constraint_name = 'activity_logs_school_id_fkey') THEN
        ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added activity_logs.school_id FK';
    END IF;
END $$;

-- STEP 2: Add Indexes (after columns and FKs exist)
DO $$
BEGIN
    -- Categories indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_categories_school_id') THEN
        CREATE INDEX idx_categories_school_id ON public.categories(school_id);
        RAISE NOTICE 'Created idx_categories_school_id';
    END IF;
    
    -- Books indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_books_school_id') THEN
        CREATE INDEX idx_books_school_id ON public.books(school_id);
        RAISE NOTICE 'Created idx_books_school_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_books_title') THEN
        CREATE INDEX idx_books_title ON public.books(title);
        RAISE NOTICE 'Created idx_books_title';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_books_isbn') THEN
        CREATE INDEX idx_books_isbn ON public.books(isbn);
        RAISE NOTICE 'Created idx_books_isbn';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_books_category_id') THEN
        CREATE INDEX idx_books_category_id ON public.books(category_id);
        RAISE NOTICE 'Created idx_books_category_id';
    END IF;
    
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

-- STEP 3: Enable RLS (after tables, columns, FKs, indexes exist)
DO $$
BEGIN
    -- Enable RLS on all tables
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schools' AND rowsecurity = true) THEN
        ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on schools';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories' AND rowsecurity = true) THEN
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on categories';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'books' AND rowsecurity = true) THEN
        ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on books';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes' AND rowsecurity = true) THEN
        ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on classes';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students' AND rowsecurity = true) THEN
        ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on students';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers' AND rowsecurity = true) THEN
        ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on teachers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'borrow_requests' AND rowsecurity = true) THEN
        ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on borrow_requests';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'borrowings' AND rowsecurity = true) THEN
        ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on borrowings';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs' AND rowsecurity = true) THEN
        ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on activity_logs';
    END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check all foreign keys exist
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('categories', 'books', 'classes', 'students', 'teachers', 'borrow_requests', 'borrowings', 'activity_logs')
ORDER BY tc.table_name, tc.constraint_name;

-- Check all indexes exist
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('categories', 'books', 'classes', 'students', 'teachers', 'borrow_requests', 'borrowings', 'activity_logs')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('schools', 'categories', 'books', 'classes', 'students', 'teachers', 'borrow_requests', 'borrowings', 'activity_logs')
ORDER BY tablename;
