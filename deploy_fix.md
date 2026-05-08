# Deploy Fix for Syntax Error

## Problem
- Site accessible tapi blank page
- Error: `main.tsx:7 Uncaught SyntaxError: Unexpected token '{'`
- Deployed version menggunakan build lama

## Solution: Redeploy dengan Build Baru

### Langkah 1: Deploy Manual
1. **Build sudah selesai** (no errors)
2. **Upload folder `dist` yang baru** ke Netlify
3. **Buka**: https://app.netlify.com/drop
4. **Drag & drop folder `dist`**

### Langkah 2: Pastikan Environment Variables
Di Netlify Dashboard → Site settings → Environment:
```
VITE_SUPABASE_URL=https://lavlemqycumxlhoxexdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdmxlbXF5Y3VteGxob3hleGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyNDUsImV4cCI6MjA4ODEzOTI0NX0.vfjJHfd76qB-3Z0N9b82u94_ZkyETs8eht_h8hAC9EM
```

### Langkah 3: Test Setelah Deploy
1. **Buka URL Netlify**
2. **Test login page:** `/login`
3. **Cek browser console** - tidak ada syntax error
4. **Test signup dan login**

## Expected Result
- ✅ Tidak ada blank page
- ✅ Tidak ada syntax error
- ✅ Login page normal
- ✅ Supabase connection active

## Troubleshooting
Jika masih error:
1. Clear browser cache
2. Coba incognito window
3. Check browser console untuk detail error
