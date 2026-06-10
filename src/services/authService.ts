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
  isActive?: boolean; // Account status - can be disabled by admin
}

// ============================================
// USER DATABASE - Hybrid approach
// ============================================

// 1. SUPER ADMIN ONLY (Hardcoded - Master Account)
const SUPER_ADMIN: HardcodedUser = {
  id: 'superadmin-001',
  email: 'superadmin@perpuspelita.id',
  password: 'SuperAdmin123!',
  name: 'Super Admin Developer',
  role: 'global_super_admin',
  schoolId: undefined, // Super admin = all schools (no specific school)
};

// 1b. DEFAULT ADMIN (for immediate testing - can be removed later)
const DEFAULT_ADMIN: HardcodedUser = {
  id: 'admin-001',
  email: 'admin',
  password: 'admin',
  name: 'Admin Perpustakaan',
  role: 'admin',
  schoolId: undefined,
  isActive: true,
};

// 1d. ADMIN PERPUS SEKOLAH (yang diminta user)
const ADMIN_PERPUS: HardcodedUser = {
  id: 'admin-perpus-001',
  email: 'adminperpus@perpuspelita.id',
  password: 'Admin123!',
  name: 'Admin Perpustakaan Sekolah',
  role: 'admin',
  schoolId: undefined,
  isActive: true,
};

// 1c. DEFAULT GURU (for testing CSV import feature)
const DEFAULT_GURU: HardcodedUser = {
  id: 'guru-001',
  email: '2024001',
  password: '2024001',
  name: 'Guru Test',
  role: 'guru',
  schoolId: undefined,
  isActive: true,
};

// 2. DYNAMIC USERS (Stored in localStorage - created by Super Admin)
// These can be created via UI by Super Admin
const DYNAMIC_USERS_KEY = 'perpuspelita_dynamic_users';

function getDynamicUsers(): HardcodedUser[] {
  const stored = localStorage.getItem(DYNAMIC_USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveDynamicUsers(users: HardcodedUser[]) {
  localStorage.setItem(DYNAMIC_USERS_KEY, JSON.stringify(users));
}

// 3. Get ALL users (Super Admin + Default + Dynamic)
function getAllUsers(): HardcodedUser[] {
  return [SUPER_ADMIN, DEFAULT_ADMIN, ADMIN_PERPUS, DEFAULT_GURU, ...getDynamicUsers()];
}

// ============================================
// AUTH FUNCTIONS - No Supabase queries
// ============================================

export async function loginWithEmail(email: string, password: string) {
  // Find user in ALL users (Super Admin + Dynamic) - case insensitive
  // Support both: "user@local.app" and "user" (without domain)
  const searchEmail = email.toLowerCase();
  const searchEmailWithoutDomain = searchEmail.replace(/@local\.app$/, '');
  
  const user = getAllUsers().find(
    u => {
      const userEmail = u.email.toLowerCase();
      // Match: exact email, or email without domain, or user stored without domain
      return (userEmail === searchEmail || userEmail === searchEmailWithoutDomain) 
        && u.password === password;
    }
  );

  if (!user) {
    return { 
      error: { message: 'Email atau password salah' }, 
      data: null 
    };
  }
  
  // Check if account is active (only for non-superadmin)
  if (user.role !== 'global_super_admin' && user.isActive === false) {
    return {
      error: { message: 'Akun Anda dinonaktifkan. Hubungi admin.' },
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
  // Find user in ALL users (INSTANT - no timeout!)
  const user = getAllUsers().find(u => u.id === userId);
  
  if (!user) {
    return { role: null, schoolId: null, profile: null, error: "User not found" };
  }

  return {
    role: user.role,
    schoolId: user.schoolId || null,
    profile: null
  };
}

// ============================================
// USER MANAGEMENT (For Super Admin)
// ============================================

// Get all users for management
export function getAllUsersList(): HardcodedUser[] {
  return getAllUsers();
}

// Create new user (Super Admin only)
export function createUser(userData: Omit<HardcodedUser, 'id'>): HardcodedUser {
  const newUser: HardcodedUser = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    isActive: userData.isActive ?? true, // Default to active
    schoolId: userData.schoolId || null, // Use null if no valid school UUID
  };
  
  const dynamicUsers = getDynamicUsers();
  dynamicUsers.push(newUser);
  saveDynamicUsers(dynamicUsers);
  
  return newUser;
}

// Activate/Deactivate user (Admin function)
export function setUserActiveStatus(userId: string, isActive: boolean): boolean {
  if (userId === SUPER_ADMIN.id) {
    return false; // Cannot deactivate Super Admin
  }
  
  const dynamicUsers = getDynamicUsers();
  const index = dynamicUsers.findIndex(u => u.id === userId);
  
  if (index === -1) return false;
  
  dynamicUsers[index].isActive = isActive;
  saveDynamicUsers(dynamicUsers);
  
  return true;
}

// Delete user (Super Admin only, cannot delete Super Admin)
export function deleteUser(userId: string): boolean {
  if (userId === SUPER_ADMIN.id) {
    return false; // Cannot delete Super Admin
  }
  
  const dynamicUsers = getDynamicUsers();
  const filtered = dynamicUsers.filter(u => u.id !== userId);
  
  if (filtered.length === dynamicUsers.length) {
    return false; // User not found
  }
  
  saveDynamicUsers(filtered);
  return true;
}

// Update user
export function updateUser(userId: string, updates: Partial<HardcodedUser>): HardcodedUser | null {
  if (userId === SUPER_ADMIN.id) {
    // Cannot update Super Admin via this function
    return null;
  }
  
  const dynamicUsers = getDynamicUsers();
  const index = dynamicUsers.findIndex(u => u.id === userId);
  
  if (index === -1) return null;
  
  dynamicUsers[index] = { ...dynamicUsers[index], ...updates };
  saveDynamicUsers(dynamicUsers);
  
  return dynamicUsers[index];
}

