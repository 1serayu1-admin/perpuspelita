# Fix 400 Bad Request Error for Signup

## Quick Debugging Steps

### 1. Check Environment Variables
Make sure your `.env` file has:
```
VITE_SUPABASE_URL=https://lavlemqycumxlhoxexdi.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 2. Test in Browser Console
1. Open browser dev tools (F12)
2. Go to Console tab
3. Paste and run this code:

```javascript
// Test with your actual anon key
const { createClient } = window.supabase;
const supabase = createClient('https://lavlemqycumxlhoxexdi.supabase.co', 'YOUR_ANON_KEY');

// Test signup
supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
}).then(console.log);
```

### 3. Common 400 Error Causes

**Invalid Email Format:**
- Ensure email is valid: `user@domain.com`
- No special characters except @ and .

**Weak Password:**
- Minimum 8 characters
- Should contain letters and numbers

**Missing Environment Variables:**
- Check if `VITE_SUPABASE_ANON_KEY` is loaded
- Verify URL is correct

**Supabase Project Settings:**
- Go to Supabase Dashboard → Authentication → Settings
- Ensure "Allow new users to sign up" is enabled
- Check if email confirmation is disabled (for testing)

### 4. Fix the Login.tsx Code

The current signup code might have issues. Try this simplified version:

```typescript
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !password) {
    toast.error('Email dan password wajib diisi');
    return;
  }

  setIsLoading(true);
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Koneksi database terputus');

    console.log('Attempting signup with:', { email, password: '***' });

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          name: email.split('@')[0],
        }
      }
    });

    console.log('Signup response:', { data, error });

    if (error) {
      console.error('Signup error:', error);
      toast.error('Gagal mendaftar: ' + error.message);
      return;
    }
    
    toast.success('Pendaftaran berhasil! Silakan login.');
    setIsSignUp(false);
  } catch (err: any) {
    console.error('Signup exception:', err);
    toast.error(err.message || 'Gagal mendaftar');
  } finally {
    setIsLoading(false);
  }
};
```

### 5. Alternative: Direct Supabase Test

Use the Supabase Dashboard to test signup:
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email and password
4. See if it works there

If it works in dashboard but not in app, the issue is in your frontend code.
