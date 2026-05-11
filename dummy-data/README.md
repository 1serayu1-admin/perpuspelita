# Dummy Data — Pilot School Seed

## Urutan Import

### Step 1 — Import Buku (wajib pertama)
1. Login sebagai `admin` / `admin123`
2. Buka `/books`
3. Klik **Download Template** (opsional, untuk referensi format)
4. Klik **Upload CSV**
5. Pilih file: `template_data_buku_perpustakaan.csv`
6. Verifikasi: 30 buku muncul di tabel

### Step 2 — Input Peminjaman Aktif (manual)
1. Buka `/peminjaman`
2. Klik **Tambah Peminjaman**
3. Buat 10–15 peminjaman dengan variasi:
   - 5 peminjaman aktif (belum dikembalikan)
   - 3 peminjaman overdue (tanggal lewat)
   - 5 peminjaman sudah dikembalikan
4. Gunakan nama siswa realistis (lihat daftar di bawah)

### Step 3 — Buat Request Peminjaman
1. Login sebagai `guru` / `guru123`
2. Buka `/pinjam-pelajaran`
3. Buat 5 request untuk buku berbeda
4. Login sebagai `kepsek` / `kepsek123`
5. Buka `/persetujuan` → approve 3, tolak 2

---

## Nama Siswa Rekomendasi (untuk input manual)
- Andi Pratama
- Budi Santoso
- Citra Dewi
- Dian Rahmawati
- Eko Wibowo
- Fajar Nugroho
- Gita Puspita
- Hendra Kurniawan
- Indah Lestari
- Joko Susilo
- Kartika Sari
- Lukman Hakim
- Maya Safitri
- Nanda Putra
- Okta Wulandari

## Nama Guru Rekomendasi
- Pak Ahmad Fauzi (Matematika)
- Bu Sri Wahyuni (Bahasa Indonesia)
- Pak Bambang Triyono (Fisika)
- Bu Dewi Kusuma (Kimia)
- Pak Ridwan Kamil (TIK)

---

## Kategori yang Akan Dibuat Otomatis
CSV import akan membuat kategori berikut secara otomatis:
- Pemrograman
- Teknologi
- Novel
- Pendidikan
- Agama
- Sejarah
- Motivasi
