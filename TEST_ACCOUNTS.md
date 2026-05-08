# TEST ACCOUNT SETUP INSTRUCTIONS

## Current Status
- ✅ Demo global_super_admin: `1serayu1@gmail.com` / `Serayu123!!` (already configured)
- ❌ Missing test accounts for other roles

## Required Test Accounts

### 1. TEST School Super Admin
- **Email**: `test.school@perpuspelita.test`
- **Password**: `TestSchool123!`
- **Role**: `school_super_admin`
- **School**: First available school in database

### 2. TEST Admin
- **Email**: `test.admin@perpuspelita.test`
- **Password**: `TestAdmin123!`
- **Role**: `admin`
- **School**: First available school in database

### 3. TEST Guru
- **Email**: `test.guru@perpuspelita.test`
- **Password**: `TestGuru123!`
- **Role**: `guru`
- **School**: First available school in database

### 4. TEST Siswa
- **Email**: `test.siswa@perpuspelita.test`
- **Password**: `TestSiswa123!`
- **Role**: `siswa`
- **School**: First available school in database

## Setup Steps

### Step 1: Check Existing Schools
```sql
SELECT id, name FROM public.schools ORDER BY created_at DESC LIMIT 5;
```

### Step 2: Create Test School (if none exists)
```sql
INSERT INTO public.schools (id, name, address, phone, email)
VALUES (
    gen_random_uuid()::text,
    'TEST SEKOLAH PERPUSTAKAAN',
    'Jl. Test No. 123',
    '08123456789',
    'test@sekolah.test'
);
```

### Step 3: Create Test Accounts
Use the Settings page → Users tab to create each test account with the credentials above.

### Step 4: Verify Accounts
```sql
SELECT 
    p.name,
    p.email,
    p.school_id,
    s.name as school_name,
    ur.role
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email LIKE 'test.%@perpuspelita.test'
ORDER BY p.email;
```

## Security Notes
- These are TEST accounts only
- Change passwords after validation
- Mark clearly as TEST accounts
- Use only for validation purposes
