-- =============================================
-- PHASE 1: FOUNDATION SCHEMA ONLY
-- MINIMAL BASE TABLES - NO INDEXES, NO FK, NO RLS
-- Run this FIRST in Supabase SQL Editor
-- =============================================

-- Schools table (foundation)
CREATE TABLE IF NOT EXISTS public.schools (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categories table (foundation)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Books table (foundation)
CREATE TABLE IF NOT EXISTS public.books (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    title text NOT NULL,
    author text NOT NULL DEFAULT '',
    publisher text NOT NULL DEFAULT '',
    year int NOT NULL DEFAULT 2024,
    isbn text NOT NULL DEFAULT '',
    category_id uuid,
    stock int NOT NULL DEFAULT 0,
    available int NOT NULL DEFAULT 0,
    shelf_location text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Classes table (foundation)
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    name text NOT NULL,
    major text NOT NULL DEFAULT '',
    homeroom_teacher text NOT NULL DEFAULT '',
    student_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Students table (foundation)
CREATE TABLE IF NOT EXISTS public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    user_id uuid,
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

-- Teachers table (foundation)
CREATE TABLE IF NOT EXISTS public.teachers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    user_id uuid,
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

-- Borrow Requests table (foundation)
CREATE TABLE IF NOT EXISTS public.borrow_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    requester_id uuid NOT NULL,
    requester_name text NOT NULL,
    requester_role text NOT NULL,
    book_id uuid,
    book_title text NOT NULL,
    reason text NOT NULL DEFAULT '',
    request_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'pending',
    reviewed_by text,
    reviewed_at timestamptz,
    rejection_reason text,
    class_name text,
    duration int,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Borrowings table (foundation)
CREATE TABLE IF NOT EXISTS public.borrowings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    type text NOT NULL DEFAULT 'regular',
    borrower_name text NOT NULL,
    borrower_id uuid NOT NULL,
    book_id uuid,
    book_title text NOT NULL,
    borrow_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    return_date date,
    status text NOT NULL DEFAULT 'borrowed',
    class_name text,
    subject text,
    teacher_name text,
    duration int,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activity Logs table (foundation)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid,
    action text NOT NULL,
    user_name text NOT NULL,
    detail text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check all foundation tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'schools', 'categories', 'books', 'classes', 
    'students', 'teachers', 'borrow_requests', 'borrowings', 'activity_logs'
)
ORDER BY table_name;

-- Check essential columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'teachers', 'classes', 'borrowings', 'borrow_requests', 'activity_logs')
AND column_name IN ('id', 'name', 'school_id', 'created_at', 'updated_at')
ORDER BY table_name, column_name;
