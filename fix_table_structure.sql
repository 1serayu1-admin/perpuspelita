-- =============================================
-- FIX TABLE STRUCTURE ISSUES
-- Jalankan di SQL Editor Supabase Dashboard
-- =============================================

-- 1. Check current structure of profiles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Drop and recreate profiles table if structure is wrong
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Recreate profiles table with correct structure
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

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 5. Check if schools table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Create schools table if it doesn't exist
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

-- 7. Verify the is_same_school function exists and works
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'is_same_school' 
AND routine_schema = 'public';
