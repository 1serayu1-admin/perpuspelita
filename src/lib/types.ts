// New role type matching database enum
export type AppRole = 'global_super_admin' | 'school_super_admin' | 'admin' | 'guru' | 'siswa';

// Legacy role type for backward compatibility with existing UI
export type Role = 'super_admin' | 'admin' | 'guru' | 'siswa';

// Map new roles to legacy roles for UI compatibility
export function toLegacyRole(role: AppRole): Role {
  if (role === 'global_super_admin' || role === 'school_super_admin') return 'super_admin';
  return role;
}

// Map legacy roles to new roles for permission checks
export function toAppRoles(legacyRoles: Role[]): AppRole[] {
  const mapped: AppRole[] = [];
  for (const r of legacyRoles) {
    if (r === 'super_admin') {
      mapped.push('global_super_admin', 'school_super_admin');
    } else {
      mapped.push(r);
    }
  }
  return mapped;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  appRole: AppRole;
  avatar?: string;
  schoolId?: string;
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
  membershipStart?: string;
  membershipEnd?: string;
}

export interface Teacher {
  id: string;
  userId?: string;
  name: string;
  nip: string;
  subject: string;
  email: string;
  isActive: boolean;
  membershipStart?: string;
  membershipEnd?: string;
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
  duration?: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  detail: string;
  timestamp: string;
}
