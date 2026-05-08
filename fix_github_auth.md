# Fix GitHub Authentication Issue

## Problem
- Repository `1serayu1-admin/perpuspelita` sudah ada
- Push gagal dengan error: `Permission to 1serayu1-admin/perpuspelita.git denied to Chale46`
- Git masih menggunakan credential user `Chale46`

## Solutions

### Option 1: Clear Credential Cache (Recommended)
```bash
# Windows
git config --global --unset credential.helper
# Atau delete credential manager cache
rundll32.exe keymgr.dll,KRShowKeyMgr
# Cari dan hapus GitHub credentials

# Setelah clear, push ulang
git push
# Akan muncul prompt login GitHub - gunakan akun 1serayu1-admin
```

### Option 2: Use Personal Access Token
1. GitHub.com → Settings → Developer settings → Personal access tokens
2. Generate new token (repo permissions)
3. Update remote URL:
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/1serayu1-admin/perpuspelita.git
   git push
   ```

### Option 3: Use GitHub CLI
```bash
# Install GitHub CLI jika belum ada
# Login dengan akun yang benar
gh auth login

# Push
git push
```

### Option 4: Deploy Manual ke Netlify (Fastest)
```bash
npm run build
# Upload folder 'dist' ke https://app.netlify.com/drop
```

## Quick Fix
Coba clear credential cache terlebihulu, kemudian push ulang. GitHub akan meminta login ulang dan gunakan akun `1serayu1-admin`.
