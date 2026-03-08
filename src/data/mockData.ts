import { Book, Category, Student, Teacher, SchoolClass, BorrowTransaction, ActivityLog, User } from '@/lib/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Super Admin', email: 'superadmin@sekolah.id', role: 'super_admin', appRole: 'global_super_admin' },
  { id: 'u2', name: 'Ibu Sari', email: 'sari@sekolah.id', role: 'admin', appRole: 'admin' },
  { id: 'u3', name: 'Pak Budi', email: 'budi@sekolah.id', role: 'guru', appRole: 'guru' },
  { id: 'u4', name: 'Andi Pratama', email: 'andi@sekolah.id', role: 'siswa', appRole: 'siswa' },
];

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Buku Pelajaran', description: 'Buku teks pelajaran kurikulum', bookCount: 45 },
  { id: 'c2', name: 'Novel', description: 'Novel fiksi dan sastra', bookCount: 32 },
  { id: 'c3', name: 'Referensi', description: 'Buku referensi dan kamus', bookCount: 18 },
  { id: 'c4', name: 'Ensiklopedia', description: 'Ensiklopedia umum dan khusus', bookCount: 12 },
  { id: 'c5', name: 'Majalah', description: 'Majalah pendidikan dan umum', bookCount: 25 },
];

export const mockBooks: Book[] = [
  { id: 'b1', title: 'Matematika Kelas X', author: 'Sukarno', publisher: 'Erlangga', year: 2023, isbn: '978-602-241-001', categoryId: 'c1', stock: 20, available: 15, shelfLocation: 'A-01' },
  { id: 'b2', title: 'Fisika Dasar', author: 'Marthen Kanginan', publisher: 'Erlangga', year: 2022, isbn: '978-602-241-002', categoryId: 'c1', stock: 15, available: 12, shelfLocation: 'A-02' },
  { id: 'b3', title: 'Laskar Pelangi', author: 'Andrea Hirata', publisher: 'Bentang Pustaka', year: 2005, isbn: '978-979-073-001', categoryId: 'c2', stock: 10, available: 7, shelfLocation: 'B-01' },
  { id: 'b4', title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', publisher: 'Lentera Dipantara', year: 2006, isbn: '978-979-073-002', categoryId: 'c2', stock: 8, available: 5, shelfLocation: 'B-02' },
  { id: 'b5', title: 'Kamus Besar Bahasa Indonesia', author: 'Tim Redaksi KBBI', publisher: 'Balai Pustaka', year: 2020, isbn: '978-979-073-003', categoryId: 'c3', stock: 5, available: 4, shelfLocation: 'C-01' },
  { id: 'b6', title: 'Ensiklopedia Indonesia', author: 'Tim Penulis', publisher: 'Gramedia', year: 2019, isbn: '978-979-073-004', categoryId: 'c4', stock: 3, available: 3, shelfLocation: 'D-01' },
  { id: 'b7', title: 'Biologi Kelas XI', author: 'Irnaningtyas', publisher: 'Erlangga', year: 2023, isbn: '978-602-241-005', categoryId: 'c1', stock: 18, available: 14, shelfLocation: 'A-03' },
  { id: 'b8', title: 'Sejarah Indonesia', author: 'Ratna Saptari', publisher: 'Gramedia', year: 2022, isbn: '978-602-241-006', categoryId: 'c1', stock: 12, available: 10, shelfLocation: 'A-04' },
  { id: 'b9', title: 'Perahu Kertas', author: 'Dee Lestari', publisher: 'Bentang Pustaka', year: 2009, isbn: '978-979-073-005', categoryId: 'c2', stock: 6, available: 4, shelfLocation: 'B-03' },
  { id: 'b10', title: 'Majalah Sains Edisi 12', author: 'Redaksi', publisher: 'Kompas', year: 2024, isbn: '978-979-073-006', categoryId: 'c5', stock: 10, available: 10, shelfLocation: 'E-01' },
];

export const mockStudents: Student[] = [
  { id: 's1', name: 'Andi Pratama', nis: '10001', classId: 'cl1', className: 'X IPA 1', major: 'IPA', email: 'andi@sekolah.id', isActive: true, membershipStart: '2024-01-15', membershipEnd: '2025-01-15' },
  { id: 's2', name: 'Budi Santoso', nis: '10002', classId: 'cl1', className: 'X IPA 1', major: 'IPA', email: 'budi.s@sekolah.id', isActive: true, membershipStart: '2024-02-01', membershipEnd: '2025-02-01' },
  { id: 's3', name: 'Citra Dewi', nis: '10003', classId: 'cl2', className: 'X IPA 2', major: 'IPA', email: 'citra@sekolah.id', isActive: true, membershipStart: '2024-01-20', membershipEnd: '2025-01-20' },
  { id: 's4', name: 'Dian Puspita', nis: '10004', classId: 'cl3', className: 'XI IPA 1', major: 'IPA', email: 'dian@sekolah.id', isActive: true, membershipStart: '2024-03-01', membershipEnd: '2025-03-01' },
  { id: 's5', name: 'Eka Firmansyah', nis: '10005', classId: 'cl4', className: 'XI IPS 1', major: 'IPS', email: 'eka@sekolah.id', isActive: true, membershipStart: '2024-01-10', membershipEnd: '2025-01-10' },
  { id: 's6', name: 'Fani Rahayu', nis: '10006', classId: 'cl5', className: 'XII IPA 1', major: 'IPA', email: 'fani@sekolah.id', isActive: false },
];

export const mockTeachers: Teacher[] = [
  { id: 't1', name: 'Pak Budi', nip: '198001012010011001', subject: 'Matematika', email: 'budi@sekolah.id', isActive: true, membershipStart: '2024-01-01', membershipEnd: '2025-12-31' },
  { id: 't2', name: 'Ibu Ani', nip: '198502152011012002', subject: 'Bahasa Indonesia', email: 'ani@sekolah.id', isActive: true, membershipStart: '2024-01-01', membershipEnd: '2025-12-31' },
  { id: 't3', name: 'Pak Joko', nip: '197903102009011003', subject: 'Fisika', email: 'joko@sekolah.id', isActive: true, membershipStart: '2024-02-15', membershipEnd: '2025-12-31' },
  { id: 't4', name: 'Ibu Ratna', nip: '198207202012012004', subject: 'Biologi', email: 'ratna@sekolah.id', isActive: true, membershipStart: '2024-01-01', membershipEnd: '2025-06-30' },
  { id: 't5', name: 'Pak Hendra', nip: '198510052013011005', subject: 'Sejarah', email: 'hendra@sekolah.id', isActive: false },
];

export const mockClasses: SchoolClass[] = [
  { id: 'cl1', name: 'X IPA 1', major: 'IPA', homeroomTeacher: 'Pak Budi', studentCount: 32 },
  { id: 'cl2', name: 'X IPA 2', major: 'IPA', homeroomTeacher: 'Ibu Ani', studentCount: 30 },
  { id: 'cl3', name: 'XI IPA 1', major: 'IPA', homeroomTeacher: 'Pak Joko', studentCount: 28 },
  { id: 'cl4', name: 'XI IPS 1', major: 'IPS', homeroomTeacher: 'Ibu Ratna', studentCount: 35 },
  { id: 'cl5', name: 'XII IPA 1', major: 'IPA', homeroomTeacher: 'Pak Hendra', studentCount: 30 },
  { id: 'cl6', name: 'XII IPS 1', major: 'IPS', homeroomTeacher: 'Ibu Ani', studentCount: 33 },
];

export const mockTransactions: BorrowTransaction[] = [
  { id: 'tr1', type: 'regular', borrowerName: 'Pak Budi', borrowerId: 't1', bookId: 'b3', bookTitle: 'Laskar Pelangi', borrowDate: '2024-03-01', dueDate: '2024-03-15', status: 'borrowed' },
  { id: 'tr2', type: 'regular', borrowerName: 'Ibu Ani', borrowerId: 't2', bookId: 'b4', bookTitle: 'Bumi Manusia', borrowDate: '2024-02-25', dueDate: '2024-03-11', returnDate: '2024-03-10', status: 'returned' },
  { id: 'tr3', type: 'lesson', borrowerName: 'Andi Pratama', borrowerId: 's1', bookId: 'b1', bookTitle: 'Matematika Kelas X', borrowDate: '2024-03-08', dueDate: '2024-03-08', status: 'borrowed', className: 'X IPA 1', subject: 'Matematika', teacherName: 'Pak Budi', duration: 45 },
  { id: 'tr4', type: 'lesson', borrowerName: 'Citra Dewi', borrowerId: 's3', bookId: 'b2', bookTitle: 'Fisika Dasar', borrowDate: '2024-03-07', dueDate: '2024-03-07', returnDate: '2024-03-07', status: 'returned', className: 'X IPA 2', subject: 'Fisika', teacherName: 'Pak Joko', duration: 60 },
  { id: 'tr5', type: 'regular', borrowerName: 'Pak Joko', borrowerId: 't3', bookId: 'b5', bookTitle: 'Kamus Besar Bahasa Indonesia', borrowDate: '2024-02-20', dueDate: '2024-03-05', status: 'late' },
  { id: 'tr6', type: 'lesson', borrowerName: 'Budi Santoso', borrowerId: 's2', bookId: 'b7', bookTitle: 'Biologi Kelas XI', borrowDate: '2024-03-08', dueDate: '2024-03-08', status: 'borrowed', className: 'X IPA 1', subject: 'Biologi', teacherName: 'Ibu Ratna', duration: 30 },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'al1', action: 'Peminjaman Buku', user: 'Ibu Sari', detail: 'Andi Pratama meminjam "Matematika Kelas X"', timestamp: '2024-03-08 08:30:00' },
  { id: 'al2', action: 'Pengembalian Buku', user: 'Ibu Sari', detail: 'Citra Dewi mengembalikan "Fisika Dasar"', timestamp: '2024-03-07 14:15:00' },
  { id: 'al3', action: 'Tambah Buku', user: 'Ibu Sari', detail: 'Menambahkan buku "Majalah Sains Edisi 12"', timestamp: '2024-03-06 10:00:00' },
  { id: 'al4', action: 'Tambah Siswa', user: 'Super Admin', detail: 'Menambahkan siswa "Fani Rahayu"', timestamp: '2024-03-05 09:00:00' },
  { id: 'al5', action: 'Edit Buku', user: 'Ibu Sari', detail: 'Mengubah stok "Laskar Pelangi" dari 8 ke 10', timestamp: '2024-03-04 11:30:00' },
];

export const monthlyBorrowData = [
  { month: 'Jan', count: 45 },
  { month: 'Feb', count: 62 },
  { month: 'Mar', count: 78 },
  { month: 'Apr', count: 55 },
  { month: 'Mei', count: 90 },
  { month: 'Jun', count: 30 },
  { month: 'Jul', count: 10 },
  { month: 'Ags', count: 48 },
  { month: 'Sep', count: 72 },
  { month: 'Okt', count: 85 },
  { month: 'Nov', count: 68 },
  { month: 'Des', count: 35 },
];

export const categoryBorrowData = [
  { category: 'Buku Pelajaran', count: 120 },
  { category: 'Novel', count: 85 },
  { category: 'Referensi', count: 45 },
  { category: 'Ensiklopedia', count: 25 },
  { category: 'Majalah', count: 35 },
];

export const dailyActivityData = [
  { day: 'Sen', pinjam: 12, kembali: 8 },
  { day: 'Sel', pinjam: 15, kembali: 10 },
  { day: 'Rab', pinjam: 8, kembali: 14 },
  { day: 'Kam', pinjam: 18, kembali: 12 },
  { day: 'Jum', pinjam: 10, kembali: 16 },
  { day: 'Sab', pinjam: 5, kembali: 6 },
];
