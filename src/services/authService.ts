import type { AppRole } from '@/lib/types';

// ============================================
// HARDCODED USERS - No database query for auth
// This eliminates all timeout issues!
// ============================================

export interface HardcodedUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AppRole;
  schoolId?: string;
}

// HARDCODED USER DATABASE
// Add/Edit users here directly
const HARDCODED_USERS: HardcodedUser[] = [
  // Super Admin (Developer)
  {
    id: 'superadmin-001',
    email: 'superadmin@perpuspelita.id',
    password: 'SuperAdmin123!',
    name: 'Super Admin Developer',
    role: 'global_super_admin',
  },
  // Admin Sekolah (Perpustakaan)
  {
    id: 'admin-001',
    email: 'admin',
    password: 'admin',
    name: 'Admin Perpustakaan',
    role: 'admin',
    schoolId: 'school-001', // Default school
  },
  // Guru (opsional, bisa tambah nanti)
  // {
  //   id: 'guru-001',
  //   email: 'guru@sekolah.id',
  //   password: 'guru123',
  //   name: 'Guru Bahasa',
  //   role: 'guru',
  //   schoolId: 'school-001',
  // },
];

// ============================================
// AUTH FUNCTIONS - No Supabase queries
// ============================================

export async function loginWithEmail(email: string, password: string) {
  // Find user in hardcoded list (case insensitive)
  const user = HARDCODED_USERS.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return { 
      error: { message: 'Email atau password salah' }, 
      data: null 
    };
  }

  // Create mock session (no Supabase needed!)
  const mockSession = {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: { name: user.name },
    }
  };

  // Store in localStorage for session persistence
  localStorage.setItem('perpuspelita_session', JSON.stringify(mockSession));
  localStorage.setItem('perpuspelita_user', JSON.stringify(user));

  return { 
    error: null, 
    data: { session: mockSession } 
  };
}

export async function logoutUser() {
  localStorage.removeItem('perpuspelita_session');
  localStorage.removeItem('perpuspelita_user');
}

export async function getCurrentSession() {
  const sessionStr = localStorage.getItem('perpuspelita_session');
  if (!sessionStr) return { data: { session: null } };
  
  try {
    const session = JSON.parse(sessionStr);
    return { data: { session } };
  } catch {
    return { data: { session: null } };
  }
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  // Simple mock - call callback with current session if exists
  const sessionStr = localStorage.getItem('perpuspelita_session');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      callback('SIGNED_IN', session);
    } catch {
      callback('SIGNED_OUT', null);
    }
  } else {
    callback('SIGNED_OUT', null);
  }

  // Return mock subscription
  return { 
    data: { 
      subscription: { 
        unsubscribe: () => {} 
      } 
    } 
  };
}

// NO DATABASE QUERY NEEDED!
export async function getUserRole(userId: string): Promise<{ role: string | null; schoolId: string | null; profile: null; error?: string }> {
  // Find user in hardcoded list (INSTANT - no timeout!)
  const user = HARDCODED_USERS.find(u => u.id === userId);
  
  if (!user) {
    return { role: null, schoolId: null, profile: null, error: "User not found" };
  }

  return {
    role: user.role,
    schoolId: user.schoolId || null,
    profile: null
  };
}

// Helper to get all hardcoded users (for admin management)
export function getHardcodedUsers(): HardcodedUser[] {
  return [...HARDCODED_USERS];
}

// Helper to add new hardcoded user (in memory only - need to edit code to persist)
export function addHardcodedUser(user: Omit<HardcodedUser, 'id'>): HardcodedUser {
  const newUser = { ...user, id: `user-${Date.now()}` };
  HARDCODED_USERS.push(newUser);
  return newUser;
}

