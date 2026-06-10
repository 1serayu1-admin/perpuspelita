# 🗺️ PERPUSPELITA APPLICATION MAP
> Dokumentasi arsitektur untuk troubleshooting & development

---

## 📁 PROJECT STRUCTURE

```
d:\perpuspelita/
├── .env.example                    # Template environment variables
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies & scripts
├── README.md                       # Project overview
├── vercel.json                     # Vercel deployment config
├── vite.config.ts                  # Vite build config
│
├── supabase/
│   └── migrations/                 # Database migrations
│       ├── 20260308152711_53a41ced...sql    # Core tables (roles, schools, profiles)
│       ├── 20260308153435_76b540...sql      # RLS policies fix
│       ├── 20260308153548_5c52f7...sql      # App tables (books, students, teachers)
│       ├── 20260308154455_9aa523...sql      # Role update/delete policies
│       ├── 20260308173942_bc80cd...sql      # IP access columns
│       ├── 20260308184030_b31a14...sql      # Username column
│       ├── 20260308214636_d02d32...sql      # Book stock functions
│       ├── 20260324012125_29103c...sql      # Security logs & devices
│       ├── 20260324012148_2d5226...sql      # Security log fixes
│       ├── 20260507000000_ai_quotas.sql     # AI quota table
│       ├── ALL_MIGRATIONS.sql      # ✅ Combined all migrations
│       ├── RESET_DATABASE.sql      # ✅ Reset script
│       └── TEST_ACCOUNTS.sql       # ✅ Sample test data
│
├── src/
│   ├── components/                 # React components
│   │   ├── CsvImportDialog.tsx     # CSV import UI
│   │   ├── ui/                     # shadcn/ui components
│   │   └── ...
│   │
│   ├── contexts/                   # React contexts
│   │   ├── AuthContext.tsx         # ✅ Authentication state
│   │   └── SettingsContext.tsx     # School settings
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useSchoolData.ts        # ✅ Fetch school-scoped data
│   │   └── useBulkSelection.ts     # Bulk selection logic
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts           # ✅ Supabase client init
│   │       └── types.ts            # Database types
│   │
│   ├── layouts/
│   │   └── AppLayout.tsx           # Main app layout
│   │
│   ├── lib/                        # Utility functions
│   │   ├── studentCredentials.ts   # ✅ Generate username/password
│   │   ├── batchImport.ts          # Batch insert helper
│   │   └── validation.ts           # Zod schemas
│   │
│   ├── pages/                      # Route pages
│   │   ├── Login.tsx               # ✅ Login page
│   │   ├── Students.tsx            # ✅ Students management + import/export
│   │   ├── Backup.tsx              # Data backup page
│   │   └── ...
│   │
│   ├── services/
│   │   └── auth/
│   │       ├── authService.ts      # ✅ Auth functions
│   │       └── createUser.ts       # User creation logic
│   │
│   ├── main.tsx                    # App entry point
│   └── App.tsx                     # Root component
```

---

## 🗄️ DATABASE SCHEMA

### Core Tables
```
┌─────────────────────────────────────────────────────────────┐
│  auth.users (Supabase Managed)                              │
│  - id (UUID PK)                                             │
│  - email                                                    │
│  - encrypted_password                                       │
│  - email_confirmed_at                                       │
│  - raw_user_meta_data (JSON)                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ TRIGGER: on_auth_user_created
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  public.profiles                                            │
│  - id (UUID PK)                                             │
│  - user_id (FK → auth.users) UNIQUE                         │
│  - school_id (FK → schools)                                 │
│  - name, email, username, avatar_url                        │
│  - is_active (boolean)                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ FK: user_id
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  public.user_roles                                          │
│  - id (UUID PK)                                             │
│  - user_id (FK → auth.users)                                │
│  - role (app_role ENUM)                                     │
│  - school_id (FK → schools)                                 │
│  UNIQUE(user_id, role, school_id)                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  public.schools (Multi-tenant root)                         │
│  - id (UUID PK)                                             │
│  - name, logo_url, address, phone, email                     │
│  - motto, vision, primary_color                             │
│  - ip_access_mode, allowed_ips                            │
│  - is_active                                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────┐
│   classes    │ │ categories │ │  books   │ │  students  │
└──────────────┘ └────────────┘ └──────────┘ └────────────┘
┌──────────────┐ ┌────────────┐ ┌─────────────────────────┐
│   teachers   │ │ borrowings │ │   borrow_requests       │
└──────────────┘ └────────────┘ └─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Supporting Tables                                          │
│  - activity_logs, security_logs, authorized_devices          │
│  - backup_history, ai_quotas                               │
└─────────────────────────────────────────────────────────────┘
```

### Role Hierarchy
```
global_super_admin     (Highest - can do everything)
    ↓
school_super_admin     (School admin - manage their school)
    ↓
admin                  (Regular admin)
    ↓
guru                   (Teacher)
    ↓
siswa                  (Student - lowest)
```

---

## 🔐 AUTHENTICATION FLOW

### Sign Up Flow
```
User Input (email, password, name)
    ↓
[Supabase Auth] signUp()
    ↓
auth.users created
    ↓
TRIGGER: on_auth_user_created
    ↓
CREATE profile (name, email from meta)
    ↓
IF first user → role = global_super_admin
ELSE → role = siswa
    ↓
Auto-login OR email confirmation
```

### Login Flow
```
User Input (email, password)
    ↓
[Supabase Auth] signInWithPassword()
    ↓
Get session + user
    ↓
Fetch user role from user_roles table
    ↓
Fetch school_id from profiles table
    ↓
Set AuthContext state
    ↓
Redirect based on role
```

### Auth Files
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/services/auth/authService.ts` - Auth functions
- `src/integrations/supabase/client.ts` - Supabase client

---

## 🔧 KEY FEATURES & FILES

### Student Import/Export
```
Location: src/pages/Students.tsx

Import CSV:
CsvImportDialog → parse CSV → batchInsertRecords → Supabase

Export Credentials:
Generate username (nama.kelas)
Generate password (random)
Generate email (username@perpuspelita.com)
↓
Export to Excel (.xlsx)

Helper: src/lib/studentCredentials.ts
```

### Multi-tenancy (School Scoping)
```
Every table has school_id column
RLS policies check: is_same_school(auth.uid(), school_id)
Hook: useSchoolData() - auto-filters by user's school
```

---

## ⚙️ ENVIRONMENT VARIABLES

### Required
```
VITE_SUPABASE_URL=https://zbwtsxowegvtbmpkuvpp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where to Set
1. **Local:** `.env` file (not committed)
2. **Vercel:** Dashboard → Project → Settings → Environment Variables
3. **GitHub:** Should NOT be in repo (security)

---

## 🚀 DEPLOYMENT

### Platform: Vercel
```
GitHub Repo → Vercel Auto-deploy
↓
Build: npm run build
↓
Deploy to: *.vercel.app
```

### Deployment URLs
- Production: (Vercel auto-generated URL)
- Project: 1serayu1-admin/perpuspelita

---

## 📋 TROUBLESHOOTING CHECKLIST

### Database Issues
- [ ] Migrations run in correct order?
- [ ] Tables exist in Supabase Table Editor?
- [ ] RLS policies blocking access?
- [ ] Foreign key constraints satisfied?

### Auth Issues
- [ ] Supabase URL correct in env vars?
- [ ] Anon Key correct?
- [ ] Signup enabled in Supabase Auth Settings?
- [ ] Email confirmation disabled for testing?
- [ ] Trigger function working? (check logs)

### Connection Issues
- [ ] DNS resolves? (zbwtsxowegvtbmpkuvpp.supabase.co)
- [ ] CORS enabled in Supabase?
- [ ] Vercel env vars updated?
- [ ] Redeploy after env var change?

### Import/Export Issues
- [ ] xlsx library installed?
- [ ] CSV format matches expected columns?
- [ ] Class names match existing classes?

---

## 🧪 TEST ACCOUNTS

```
First Signup (becomes global_super_admin):
Email: admin@perpuspelita.com
Password: Admin123!!

Other test accounts to create:
kepsek@perpuspelita.com / Kepsek123!! → school_super_admin
guru@perpuspelita.com / Guru123!! → guru
siswa@perpuspelita.com / Siswa123!! → siswa
```

---

## 📚 USEFUL LINKS

- Supabase Dashboard: https://supabase.com/dashboard/project/zbwtsxowegvtbmpkuvpp
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/1serayu1-admin/perpuspelita

---

## 📝 NOTES

- **Project Type:** React + Vite + TypeScript + Supabase
- **UI Library:** shadcn/ui + Tailwind CSS
- **Auth:** Supabase Auth with custom RLS
- **Database:** PostgreSQL with Row Level Security
- **Multi-tenant:** School-based data isolation

---

*Last Updated: 2026-06-10*
*Status: Database migrated, ready for testing*
