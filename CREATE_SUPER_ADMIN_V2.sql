-- =============================================
-- CREATE NEW SUPER ADMIN ACCOUNT (FIXED VERSION)
-- Run this in Supabase SQL Editor
-- =============================================

-- Delete existing profiles entry if exists (cleanup)
DELETE FROM public.profiles WHERE email = 'superadmin@perpuspelita.id';
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'superadmin@perpuspelita.id');
DELETE FROM auth.users WHERE email = 'superadmin@perpuspelita.id';

-- Generate new user ID
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    new_email TEXT := 'superadmin@perpuspelita.id';
    new_password TEXT := 'SuperAdmin123!';
BEGIN
    -- Create user in auth.users
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
        new_user_id,
        new_email,
        jsonb_build_object('name', 'Super Admin Developer'),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        crypt(new_password, gen_salt('bf')),
        '00000000-0000-0000-0000-000000000000'
    );

    -- Create profile (id pakai uuid berbeda dari user_id)
    INSERT INTO public.profiles (
        id,
        user_id,
        email,
        name,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),  -- id berbeda dari user_id
        new_user_id,
        new_email,
        'Super Admin Developer',
        NOW(),
        NOW()
    );

    -- Assign global_super_admin role
    INSERT INTO public.user_roles (
        user_id,
        role,
        school_id,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'global_super_admin',
        NULL,
        NOW(),
        NOW()
    );

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SUPER ADMIN CREATED SUCCESSFULLY!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Email: %', new_email;
    RAISE NOTICE 'Password: %', new_password;
    RAISE NOTICE 'Role: global_super_admin';
    RAISE NOTICE '===========================================';
END $$;

-- Verify the user was created
SELECT 
    p.name,
    p.email,
    ur.role,
    ur.school_id,
    p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'superadmin@perpuspelita.id';
