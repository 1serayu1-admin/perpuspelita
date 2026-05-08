# Connect Supabase to Netlify Deployment

## Problem
"Supabase not ready" - Environment variables belum di-set di Netlify

## Solution: Setup Environment Variables di Netlify

### Langkah 1: Buka Netlify Dashboard
1. Buka https://app.netlify.com
2. Pilih site yang baru di-deploy
3. Go to **Site settings** → **Build & deploy** → **Environment**

### Langkah 2: Add Environment Variables
Tambahkan environment variables berikut:

```
VITE_SUPABASE_URL=https://lavlemqycumxlhoxexdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdmxlbXF5Y3VteGxob3hleGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyNDUsImV4cCI6MjA4ODEzOTI0NX0.vfjJHfd76qB-3Z0N9b82u94_ZkyETs8eht_h8hAC9EM
```

### Langkah 3: Trigger Redeploy
1. Setelah menambah environment variables
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**
4. Tunggu proses deploy selesai

### Langkah 4: Test Connection
1. Buka URL Netlify site
2. Test login page: `/login`
3. Coba signup dan login
4. Pastikan tidak ada error "Supabase not ready"

## Alternative: Connect via Supabase Integration
1. Di Netlify Dashboard → **Integrations**
2. Cari **Supabase** integration
3. Connect dengan Supabase project
4. Auto-import environment variables

## Verification
Setelah deploy selesai:
- ✅ Login page harus normal
- ✅ Signup functionality bekerja
- ✅ Tidak ada "Failed to load module script" error
- ✅ Supabase connection established
