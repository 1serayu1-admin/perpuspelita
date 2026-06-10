# 🔐 LAPORAN CREDENTIALS LOGIN SISWA KELAS X

**Tanggal:** 10 Juni 2026  
**Sekolah:** SMK Pelita  
**Total Siswa:** 260 siswa

---

## 📋 DAFTAR KELAS & JUMLAH

| Kelas | Jurusan | Jumlah |
|-------|---------|--------|
| X AK | Akuntansi | 15 |
| X BD | Bisnis Digital | 17 |
| X MP | Manajemen Perkantoran | 15 |
| X RPL | Rekayasa Perangkat Lunak | 24 |
| X TKJ 1 | Teknik Komputer Jaringan | 32 |
| X TKJ 2 | Teknik Komputer Jaringan | 31 |
| X TKR 1 | Teknik Kendaraan Ringan | 34 |
| X TKR 2 | Teknik Kendaraan Ringan | 33 |
| X TSM 1 | Teknik Sepeda Motor | 29 |
| X TSM 2 | Teknik Sepeda Motor | 30 |
| **TOTAL** | | **260** |

---

## 🔑 CONTOH CREDENTIALS (10 SISWA PERTAMA)

| No | Nama | NIS | Kelas | Username | Password | Email |
|----|------|-----|-------|----------|----------|-------|
| 1 | Andin Rahmadani | 2024001 | X AK | andin.rahmadani.xak | kdn9#pL2 | andin.rahmadani.xak@local.app |
| 2 | AULIYA FATIMAH | 2024002 | X AK | auliya.fatimah.xak | mtf4!Wq8 | auliya.fatimah.xak@local.app |
| 3 | DAVIN FIQIH PRATAMA | 2024003 | X AK | davin.fiqih.xak | hpr7@Nc3 | davin.fiqih.xak@local.app |
| 4 | DWI CAHYA NINGSIH | 2024004 | X AK | dwi.cahya.xak | ngs2#Xm9 | dwi.cahya.xak@local.app |
| 5 | ERITA NUR ASIH | 2024005 | X AK | erita.nur.xak | ash5!Kp4 | erita.nur.xak@local.app |
| 6 | FINZANADY ARYAPUTRA IKHSAN | 2024006 | X AK | finzanady.arya.xak | khs8@Tb1 | finzanady.arya.xak@local.app |
| 7 | MADU MITA YANI | 2024007 | X AK | madu.mita.xak | yni3#Rv6 | madu.mita.xak@local.app |
| 8 | MEDIKA ARGES DWI PANGGA | 2024008 | X AK | medika.arges.xak | pgg4!Jw7 | medika.arges.xak@local.app |
| 9 | MEGA SILVIA | 2024009 | X AK | mega.silvia.xak | slv9#Qp2 | mega.silvia.xak@local.app |
| 10 | NAILA RAHMA | 2024010 | X AK | naila.rahma.xak | rhm6!Zx5 | naila.rahma.xak@local.app |

---

## 📁 FILE YANG SUDAH SIAP

| File | Deskripsi | Lokasi |
|------|-----------|--------|
| `DATA_SISWA_X_READY.csv` | File import untuk aplikasi | `docs/` |
| `LAPORAN_CREDENTIALS_SISWA_X.md` | Laporan lengkap (ini) | `docs/` |

---

## 📤 CARA IMPORT KE APLIKASI

### 1. Persiapan
- Login sebagai **Admin** atau **Super Admin**
- Pastikan kelas sudah dibuat di menu **Kelas**

### 2. Import Data
1. Buka menu **Students**
2. Klik **"Import CSV"**
3. Pilih file: `DATA_SISWA_X_READY.csv`
4. Mapping kolom (otomatis):
   - `name` → Nama
   - `nis` → NIS
   - `class` → Kelas
   - `major` → Jurusan
5. Klik **Import**

### 3. Export Credentials
1. Setelah import berhasil
2. Klik **"Export Credentials"**
3. Download file Excel: `siswa_credentials.xlsx`
4. File berisi semua username & password siswa

---

## 🔐 FORMAT LOGIN SISWA

### Username:
```
Format: nama.kelas (lowercase, no spaces)
Contoh: andin.rahmadani.xak
```

### Password:
```
Format: Random 8 karakter
Contoh: kdn9#pL2
```

### Email (auto-generate):
```
Format: username@local.app
Contoh: andin.rahmadani.xak@local.app
```

---

## 📝 PETUNJUK PENGGUNAAN

### Untuk Admin:
1. Simpan file credentials dengan **AMAN & RAHASIA**
2. Bagikan username & password ke siswa masing-masing
3. Sarankan siswa untuk **ganti password** setelah login pertama

### Untuk Siswa:
1. Buka halaman login aplikasi
2. Masukkan **Username** (contoh: `andin.rahmadani.xak`)
3. Masukkan **Password** (contoh: `kdn9#pL2`)
4. Klik **"Masuk"**
5. Setelah login, **ganti password** di menu Profil

---

## ⚠️ CATATAN KEAMANAN

- **JANGAN** share password publik
- **JANGAN** simpan password di tempat yang mudah diakses orang lain
- Setiap siswa memiliki password **UNIK**
- Email `@local.app` hanya untuk sistem internal

---

## 🔄 PROSES GENERATE CREDENTIALS

```
Import CSV
    ↓
Sistem generate username (nama.kelas)
    ↓
Sistem generate password (random 8 karakter)
    ↓
Sistem generate email (username@local.app)
    ↓
Export Excel dengan semua credentials
    ↓
Siswa login dengan username & password
```

---

## 📊 RINGKASAN

| Item | Detail |
|------|--------|
| Total Siswa | 260 |
| Format Username | nama.kelas (lowercase) |
| Format Password | 8 karakter (huruf+angka+simbol) |
| Domain Email | @local.app |
| File Import | `DATA_SISWA_X_READY.csv` |

---

*Laporan ini digenerate otomatis oleh sistem Perpuspelita*  
*Tanggal: 10 Juni 2026*
