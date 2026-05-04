# Setup Project Baru Supabase

Project: `ajmmyxeyqjzkdtqsyqrc`

## Langkah Setup

### 1. Update .env Key (WAJIB)
Ganti Publishable Key di `.env` dengan key dari project baru:
```bash
# Ambil dari: Supabase Dashboard → Project Settings → API → anon/public key
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Jalankan SQL Setup
1. Buka [Supabase Dashboard](https://supabase.com/dashboard/project/ajmmyxeyqjzkdtqsyqrc)
2. Pilih **SQL Editor**
3. New Query
4. Copy isi `setup_new_project.sql`
5. Run

### 3. Deploy Edge Functions
```bash
# Install Supabase CLI jika belum
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref ajmmyxeyqjzkdtqsyqrc

# Deploy functions
supabase functions deploy check-ip
supabase functions deploy reset-password
```

### 4. Set Environment Variables untuk Functions
Di Dashboard → Edge Functions → Configuration:
```
SUPABASE_URL=https://ajmmyxeyqjzkdtqsyqrc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Service Role Key dari Dashboard]
```

### 5. Update config.toml (DONE ✅)
Sudah otomatis terupdate.

### 6. Test Setup
Signup user pertama → otomatis jadi **Global Super Admin**

## File yang Sudah Terupdate
- ✅ `.env` - URL & Project ID
- ✅ `supabase/config.toml` - project_id
- ✅ `supabase/setup_new_project.sql` - Full schema + RLS
- ✅ `src/services/auth/` - Sudah pakai URL baru

## Struktur Database
| Table | RLS | Keterangan |
|-------|-----|------------|
| schools | ✅ | Data sekolah |
| profiles | ✅ | Profil user |
| user_roles | ✅ | Role assignment |
| categories | ✅ | Kategori buku |
| books | ✅ | Data buku |
| classes | ✅ | Kelas |
| students | ✅ | Data siswa |
| teachers | ✅ | Data guru |
| borrow_requests | ✅ | Permintaan pinjam |
| borrowings | ✅ | Transaksi pinjam |
| activity_logs | ✅ | Log aktivitas |
| security_logs | ✅ | Log keamanan |
| backup_history | ✅ | Riwayat backup |
| authorized_devices | ✅ | Perangkat |

## Functions
- `has_role(uid, role)` - Cek role
- `has_any_role(uid, roles[])` - Cek multiple roles
- `is_same_school(uid, school_id)` - Cek sekolah
- `decrement_book_available(book_id)` - Kurangi stok
- `increment_book_available(book_id)` - Tambah stok
- `handle_new_user()` - Trigger: first user = super admin

## Roles
- `global_super_admin` - Super admin global
- `school_super_admin` - Admin sekolah
- `admin` - Petugas perpustakaan
- `guru` - Guru
- `siswa` - Siswa

## Siap! 🚀
Build dan deploy aplikasi setelah setup database selesai.
