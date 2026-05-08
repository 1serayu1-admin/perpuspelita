# Fix Auth Callback Error

## Problem
```
TypeError: Cannot destructure property 'role' of '(intermediate value)' as it is null.
```

## Root Cause
Error terjadi karena `getUserRole()` function mengembalikan `null` ketika user tidak memiliki profile atau role di database.

## Solutions

### Option 1: Fix getUserRole Function (Recommended)
Di `src/services/auth/authService.ts`, tambahkan null check:

```typescript
export async function getUserRole(userId: string): Promise<{ role: AppRole; schoolId?: string; profile?: any }> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    // Return default role if no profile
    return { role: 'siswa' };
  }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const userRoles = (roles || []).map(r => r.role as AppRole);
  const primaryRole: AppRole = roleHierarchy.find(r => userRoles.includes(r)) || 'siswa';

  return {
    role: primaryRole,
    schoolId: profile.school_id || undefined,
    profile
  };
}
```

### Option 2: Fix AuthContext Callback
Di `src/contexts/AuthContext.tsx`, tambahkan null check:

```typescript
if (session) {
  try {
    const { role: fetchedRole, schoolId, profile } = await getUserRole(session.user.id);
    setUser({
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.email!,
      role: fetchedRole,
      appRole: fetchedRole,
      schoolId
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    // Set default role
    setUser({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.email!,
      role: 'siswa',
      appRole: 'siswa',
      schoolId: undefined
    });
  }
}
```

### Option 3: Database Fix
Jalankan SQL untuk memastikan semua user memiliki profile dan role:

```sql
-- Create missing profiles
INSERT INTO public.profiles (user_id, name, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', email),
    email
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- Create missing roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
    id,
    'siswa'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);
```

## Quick Fix
Rebuild dan deploy setelah mengimplementasi salah satu solution di atas.

## Expected Result
- ✅ Login tanpa error
- ✅ User default ke role 'siswa' jika tidak ada role
- ✅ Tidak ada destructure null error
