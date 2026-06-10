# 📥 CARA IMPORT SISWA & GENERATE CREDENTIALS

## 📝 LANGKAH-LANGKAH

### 1. Siapkan File CSV

**Format CSV (kolom wajib):**
```csv
name,nis,class,major
Ahmad Fauzi,2024001,X-A,IPA
Budi Santoso,2024002,X-A,IPA
Citra Lestari,2024003,X-B,IPS
```

**File template:** `docs/STUDENT_IMPORT_TEMPLATE.csv`

### 2. Pastikan Kelas Sudah Ada

Sebelum import, pastikan kelas sudah dibuat di menu **Kelas**:
- X-A (IPA)
- X-B (IPS)
- XI-A (IPA)
- XI-B (IPS)

### 3. Import di Menu Students

1. Login sebagai **Admin**
2. Buka menu **Students**
3. Klik tombol **"Import CSV"**
4. Upload file CSV
5. Mapping kolom (jika header beda)
6. Klik **Import**

### 4. Generate Credentials

Setelah import berhasil:

1. Klik tombol **"Export Credentials"**
2. File Excel akan terdownload: `siswa_credentials.xlsx`
3. File berisi:
   - Nama siswa
   - NIS
   - Kelas
   - **Username** (auto-generate)
   - **Password** (auto-generate)
   - Email (@local.app)

---

## 🔐 FORMAT CREDENTIALS

### Username:
```
Format: nama.kelas (lowercase, no space)
Contoh: "Ahmad Fauzi" + "X-A" → ahmad.fauzi.xa
```

### Password:
```
Format: Random 8 karakter
Contoh: abc123!@
```

### Email:
```
Format: username@local.app
Contoh: ahmad.fauzi.xa@local.app
```

---

## 📊 CONTOH LAPORAN

| Nama | NIS | Kelas | Username | Password |
|------|-----|-------|----------|----------|
| Ahmad Fauzi | 2024001 | X-A | ahmad.fauzi.xa | abc123!@ |
| Budi Santoso | 2024002 | X-A | budi.santoso.xa | def456#$ |

---

## ⚠️ CATATAN PENTING

### Keamanan:
- **Simpan file credentials dengan aman!**
- Jangan share password publik
- Siswa bisa ganti password setelah login

### Kelas:
- Nama kelas di CSV harus **sama persis** dengan di database
- Contoh: "X-A" (bukan "XA" atau "10-A")

### Email:
- Email auto-generate dengan domain `@local.app`
- Tidak perlu isi kolom email di CSV (boleh kosong)

---

## 🔄 ALUR KERJA SISTEM

```
Upload CSV
    ↓
Parsing data siswa
    ↓
Insert ke tabel students
    ↓
Generate credentials (username, password)
    ↓
Export Excel untuk admin
    ↓
Siswa login dengan username/password
```

---

## 🆘 TROUBLESHOOTING

### Import Gagal:
- Cek format CSV (harus pakai koma `,`)
- Cek nama kelas (harus sama dengan database)
- NIS tidak boleh kosong

### Export Credentials Kosong:
- Pastikan ada data siswa di tabel
- Refresh halaman dulu

### Login Siswa Gagal:
- Username: tanpa `@local.app` (contoh: `ahmad.fauzi.xa`)
- Password: sesuai di laporan
- Pastikan siswa sudah di-import

---

*Dokumentasi ini untuk sistem Perpuspelita*
