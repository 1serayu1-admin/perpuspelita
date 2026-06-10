-- =============================================
-- DELETE ALL STUDENTS DATA
-- Run this to clear all students for fresh import
-- =============================================

-- Delete all students (be careful!)
DELETE FROM public.students;

-- Reset sequence if exists (optional)
-- ALTER SEQUENCE IF EXISTS public.students_id_seq RESTART WITH 1;

-- Verify deletion
SELECT COUNT(*) as total_students FROM public.students;
