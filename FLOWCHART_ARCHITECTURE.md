# PERPUSTAKAAN DIGITAL - FLOWCHART ARSITEKTUR

## MASTER APP FLOW

```
APP START
│
├── Load ENV
├── Init Supabase Client
├── Mount React App
├── Mount Providers
│   ├── QueryClientProvider
│   ├── AuthProvider
│   └── Toaster
│
└── Router Start
```

---

## ROUTING FLOW

```
REQUEST URL
│
├── /login
│   └── Render Login Page
│
├── /dashboard
├── /books
├── /users
├── /settings
│
└── ProtectedRoute
     │
     ├── Session valid?
     │    ├── NO → /login
     │    └── YES
     │
     ├── Role allowed?
     │    ├── NO → Access Denied
     │    └── YES
     │
     └── Render Page
```

---

## AUTH FLOW (NO BUG VERSION)

```
APP LOAD
│
├── AuthProvider boot
│
├── getSession()
│    ├── session ada
│    │    └── setUser()
│    │
│    └── session kosong
│         └── user = null
│
└── loading = false
```

## LOGIN FLOW

```
User submit login
│
├── validate form
├── signInWithPassword()
│
├── success?
│   ├── NO → toast error
│   └── YES
│
├── setUser()
└── navigate /dashboard
```

## LOGOUT FLOW

```
Klik logout
│
├── signOut()
├── clear local state
├── user = null
└── navigate /login
```

---

## ROLE SYSTEM FLOW

```
User Login
│
├── Read role:
│   ├── global_super_admin
│   ├── admin
│   ├── school_super_admin
│   ├── guru
│   └── siswa
│
└── Route permission map
```

## ROLE MATRIX

```
Super Admin       = full access
Admin             = management sekolah
School SuperAdmin = sekolah sendiri
Guru              = pinjam / approval tertentu
Siswa             = katalog / request pinjam
```

---

## BOOK MODULE FLOW

```
Books Page
│
├── Fetch books list
├── Search / Filter
├── Pagination
│
├── Add book
├── Edit book
├── Delete book
│
└── Borrow action
```

---

## BORROWING FLOW

```
User pilih buku
│
├── stok tersedia?
│   ├── NO → tampil unavailable
│   └── YES
│
├── submit request
│
├── approval needed?
│   ├── YES → status pending
│   └── NO → approved
│
└── create borrowing record
```

---

## RETURN FLOW

```
User return book
│
├── scan / pilih transaksi
├── hitung telat?
│   ├── YES → fine/log
│   └── NO
│
├── update status returned
└── tambah stok buku
```

---

## DASHBOARD FLOW

```
Dashboard Load
│
├── Count books
├── Count borrowed
├── Count overdue
├── Count users
├── Recent activity
└── Charts
```

---

## ERROR HANDLING FLOW

```
Any API Call
│
├── loading start
├── try request
│
├── success
│   └── update UI
│
├── fail
│   └── toast error
│
└── finally loading false
```

---

## ZERO BUG RULES

### Semua async wajib:
```
try / catch / finally
```

### Semua page fetch wajib:
```
loading state
empty state
error state
success state
```

### Semua form wajib:
```
validation
disabled submit while loading
success feedback
error feedback
```

---

## DATABASE FLOW

```
auth.users
│
├── profiles
├── user_roles
├── schools
├── books
├── borrowings
├── categories
└── activity_logs
```

---

## DEPLOY FLOW

```
git add .
git commit
git push main
│
└── Netlify Auto Deploy
     │
     ├── Build success?
     │   ├── NO → fix build
     │   └── YES
     │
     └── Production verify
```

---

## DEBUG FLOW (WAJIB)

```
Bug ditemukan
│
├── reproduce
├── isolate file owner
├── add logs
├── root cause
├── minimal fix
├── retest
└── deploy
```

---

## FILE OWNERSHIP MAP

```
main.tsx            = boot app
AuthContext.tsx     = auth state
ProtectedRoute.tsx  = access control
authService.ts      = supabase API
pages/*             = UI pages
components/*        = reusable UI
```

---

## NEXT LEVEL RECOMMENDED

Pisahkan layer:

```
pages/
components/
hooks/
services/
contexts/
types/
utils/
validators/
```

---

## RULE FINAL

Kalau ada bug, tanya:

```
Bug ini milik layer mana?
UI?
State?
Route?
API?
Database?
Deploy?
```

Jangan langsung ngoding.
```

---

## CURRENT ARCHITECTURE STATUS

✅ **Fixed Issues:**
- AuthProvider moved to root (no remount)
- ProtectedRoute bypassed for testing
- Service worker disabled (no cache)
- Version markers added
- Loading state tracked

🔧 **Current Structure:**
```
src/
├── main.tsx (App boot + providers + routes)
├── contexts/AuthContext.tsx (Auth state + session)
├── components/auth/ProtectedRoute.tsx (Access control)
├── services/authService.ts (Supabase API)
├── pages/ (UI pages)
└── components/ (Reusable UI)
```

📋 **Next Steps:**
- Monitor console logs after deploy
- Verify AuthProvider mounts only once
- Test dashboard loading without spinner
- Re-enable ProtectedRoute after fix confirmed
