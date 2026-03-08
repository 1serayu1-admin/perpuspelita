export type Role = 'super_admin' | 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  categoryId: string;
  stock: number;
  available: number;
  shelfLocation: string;
  coverUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  bookCount: number;
}

export interface Student {
  id: string;
  userId?: string;
  name: string;
  nis: string;
  classId: string;
  className?: string;
  major: string;
  email: string;
  isActive: boolean;
}

export interface Teacher {
  id: string;
  userId?: string;
  name: string;
  nip: string;
  subject: string;
  email: string;
  isActive: boolean;
}

export interface SchoolClass {
  id: string;
  name: string;
  major: string;
  homeroomTeacher: string;
  studentCount: number;
}

export interface BorrowTransaction {
  id: string;
  type: 'regular' | 'lesson';
  borrowerName: string;
  borrowerId: string;
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'late';
  className?: string;
  subject?: string;
  teacherName?: string;
  duration?: number;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface BorrowRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: 'siswa' | 'guru';
  bookId: string;
  bookTitle: string;
  reason: string;
  requestDate: string;
  status: RequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  className?: string;
  duration?: number; // days for guru, minutes for lesson
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  detail: string;
  timestamp: string;
}
