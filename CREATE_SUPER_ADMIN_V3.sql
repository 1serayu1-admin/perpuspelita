-- =============================================
-- CREATE NEW SUPER ADMIN ACCOUNT (VERSION 3 - FIXED)
-- Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Delete existing data if exists
DELETE FROM public.profiles WHERE email = 'superadmin@perpuspelita.id';
DELETE FROM public.user_roles WHERE user_id = 'c12711a7-e868-4e1a-9954-4c19f504213a';
DELETE FROM auth.users WHERE email = 'superadmin@perpuspelita.id';

-- Step 2: Create user
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_sent_at,
    email_confirmed_at,
    encrypted_password,
    instance_id
) VALUES (
    'c12711a7-e868-4e1a-9954-4c19f504213a',
    'superadmin@perpuspelita.id',
    '{"name": "Super Admin Developer"}'::jsonb,
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    crypt('SuperAdmin123!', gen_salt('bf')),
    '00000000-0000-0000-0000-000000000000'
);

-- Step 3: Create profile
INSERT INTO public.profiles (
    id,
    user_id,
    email,
    name,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'c12711a7-e868-4e1a-9954-4c19f504213a',
    'superadmin@perpuspelita.id',
    'Super Admin Developer',
    NOW(),
    NOW()
);

-- Step 4: Assign global_super_admin role
INSERT INTO public.user_roles (
    user_id,
    role,
    school_id,
    created_at,
    updated_at
) VALUES (
    'c12711a7-e868-4e1a-9954-4c19f504213a',
    'global_super_admin',
    NULL,
    NOW(),
    NOW()
);

-- Step 5: Verify
SELECT 
    p.name,
    p.email,
    ur.role,
    ur.school_id,
    p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'superadmin@perpuspelita.id';
