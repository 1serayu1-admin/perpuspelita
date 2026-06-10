-- =====================================================
-- DELETE ALL BOOKS - Reset data buku ke kosong
-- =====================================================

-- Hapus semua data dari table books
DELETE FROM public.books;

-- Reset sequence ID (opsional)
-- ALTER SEQUENCE public.books_id_seq RESTART WITH 1;

-- Verifikasi
SELECT COUNT(*) as total_books FROM public.books;
