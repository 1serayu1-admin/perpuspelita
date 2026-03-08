import { z } from 'zod';

// Sanitize string: trim, remove control characters
function sanitize(val: string): string {
  return val.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

const sanitizedString = (max = 255) =>
  z.string().transform(sanitize).pipe(z.string().min(1, 'Wajib diisi').max(max, `Maksimal ${max} karakter`));

const optionalSanitizedString = (max = 255) =>
  z.string().transform(sanitize).pipe(z.string().max(max).optional()).or(z.literal(''));

// --- Students ---
export const studentSchema = z.object({
  name: sanitizedString(100),
  nis: sanitizedString(50),
  email: z.string().trim().email('Format email tidak valid').or(z.literal('')),
  class_id: z.string().nullable().optional(),
  major: optionalSanitizedString(100),
});

// --- Teachers ---
export const teacherSchema = z.object({
  name: sanitizedString(100),
  nip: sanitizedString(50),
  subject: sanitizedString(100),
  email: z.string().trim().email('Format email tidak valid').or(z.literal('')),
});

// --- Books ---
export const bookSchema = z.object({
  title: sanitizedString(255),
  author: sanitizedString(255),
  publisher: sanitizedString(255),
  year: z.number().int().min(1900, 'Tahun minimal 1900').max(2100, 'Tahun maksimal 2100'),
  isbn: optionalSanitizedString(50),
  category_id: z.string().nullable().optional(),
  stock: z.number().int().min(0, 'Stok minimal 0').max(99999),
  available: z.number().int().min(0, 'Ketersediaan minimal 0').max(99999),
  shelf_location: optionalSanitizedString(50),
});

// --- Borrow Request ---
export const borrowRequestSchema = z.object({
  reason: sanitizedString(500),
  duration: z.number().int().min(1).max(30).nullable().optional(),
});

// --- Admin: Create User ---
export const createUserSchema = z.object({
  name: sanitizedString(100),
  username: optionalSanitizedString(50),
  email: z.string().trim().email('Format email tidak valid').or(z.literal('')),
  password: z.string().min(6, 'Password minimal 6 karakter').max(128),
});

// --- Restore JSON sanitization ---
const ALLOWED_RESTORE_FIELDS = new Set([
  'name', 'nis', 'nip', 'email', 'subject', 'major', 'title', 'author', 'publisher',
  'isbn', 'year', 'stock', 'available', 'shelf_location', 'cover_url', 'category_id',
  'class_id', 'school_id', 'is_active', 'homeroom_teacher', 'student_count',
  'description', 'book_title', 'borrower_name', 'borrower_id', 'book_id',
  'borrow_date', 'due_date', 'return_date', 'status', 'type', 'class_name',
  'teacher_name', 'duration', 'requester_id', 'requester_name', 'requester_role',
  'reason', 'request_date', 'reviewed_by', 'reviewed_at', 'rejection_reason',
  'membership_start', 'membership_end', 'user_id', 'motto', 'vision',
]);

export function sanitizeRestoreRow(row: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!ALLOWED_RESTORE_FIELDS.has(key)) continue;
    if (typeof value === 'string') {
      cleaned[key] = sanitize(value).slice(0, 1000);
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// --- Login rate limiting ---
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 1 minute

export function checkRateLimit(identifier: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Reset if lockout has expired
  if (now - entry.lastAttempt > LOCKOUT_MS) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingMs: LOCKOUT_MS - (now - entry.lastAttempt) };
  }

  entry.count++;
  entry.lastAttempt = now;
  return { allowed: true };
}

export function resetRateLimit(identifier: string) {
  loginAttempts.delete(identifier);
}
