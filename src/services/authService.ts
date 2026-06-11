import type { AppRole } from '@/lib/types';
import { getSupabase } from '@/integrations/supabase/client';

// ============================================
// HYBRID AUTH - Supabase Auth + localStorage Fallback
// Supports cross-device login via Supabase Auth
// Fallback to localStorage for offline/resilience
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
  const searchEmail = email.toLowerCase();
  const searchEmailWithoutDomain = searchEmail.replace(/@local\.app$/, '');
  
  // STEP 1: Try Supabase Auth first (for cross-device login)
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: searchEmail,
        password: password,
      });
      
      if (!authError && authData.user) {
        // Get user metadata from Supabase Auth
        const userMetadata = authData.user.user_metadata;
        
        return {
          error: null,
          data: {
            session: {
              user: {
                id: authData.user.id,
                email: authData.user.email || searchEmail,
                user_metadata: {
                  name: userMetadata?.name || '',
                  role: userMetadata?.role || 'siswa',
                },
              },
            },
          },
        };
      }
      // If auth fails, continue to localStorage fallback
      console.log('[loginWithEmail] Supabase Auth failed, trying localStorage:', authError?.message);
    }
  } catch (e) {
    console.log('[loginWithEmail] Supabase Auth error:', e);
  }
  
  // STEP 2: Fallback to localStorage (for existing hardcoded users)
  const allUsers = getAllUsers();
  console.log('Login debug - Searching for:', searchEmail);
  console.log('All users count:', allUsers.length);
  console.log('Dynamic users:', allUsers.filter(u => u.id?.startsWith('user-')).map(u => ({ email: u.email, role: u.role })));
  
  const user = allUsers.find(
    u => {
      const userEmail = u.email.toLowerCase();
      const emailMatches = (userEmail === searchEmail || userEmail === searchEmailWithoutDomain);
      const passwordWithoutSuffix = password.replace(/@pelita$/, '');
      const passwordMatches = (u.password === password || u.password === passwordWithoutSuffix || u.email === password || u.email === passwordWithoutSuffix);
      return emailMatches && passwordMatches;
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

  // Create mock session (for hardcoded users)
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

  // Auto-sync to Supabase Auth (background, non-blocking)
  syncUserToSupabase(user).then(() => {
    console.log('[loginWithEmail] User synced to Supabase Auth');
  }).catch(() => {
    // Silent fail - user can still login on this device
  });

  return { 
    error: null, 
    data: { session: mockSession } 
  };
}

export async function logoutUser() {
  localStorage.removeItem('perpuspelita_session');
  localStorage.removeItem('perpuspelita_user');
}

// Auto-sync localStorage user to Supabase Auth (background migration)
export async function syncUserToSupabase(user: HardcodedUser): Promise<void> {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    
    // Check if user already exists in Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    
    if (!signInError && signInData.user) {
      // User already exists in Supabase Auth, update ID to match
      if (user.id !== signInData.user.id) {
        const dynamicUsers = getDynamicUsers();
        const userIndex = dynamicUsers.findIndex(u => u.email === user.email);
        if (userIndex >= 0) {
          dynamicUsers[userIndex].id = signInData.user.id;
          saveDynamicUsers(dynamicUsers);
          console.log('[syncUserToSupabase] Updated user ID to match Supabase:', signInData.user.id);
        }
      }
      return;
    }
    
    // User doesn't exist in Supabase Auth, create it
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          name: user.name,
          role: user.role,
        },
      },
    });
    
    if (!signUpError && signUpData.user) {
      // Update localStorage user ID to match Supabase Auth
      const dynamicUsers = getDynamicUsers();
      const userIndex = dynamicUsers.findIndex(u => u.email === user.email);
      if (userIndex >= 0) {
        dynamicUsers[userIndex].id = signUpData.user.id;
        saveDynamicUsers(dynamicUsers);
        console.log('[syncUserToSupabase] Created Supabase Auth user:', signUpData.user.id);
      }
    } else {
      console.log('[syncUserToSupabase] Sign up error:', signUpError?.message);
    }
  } catch (e) {
    console.log('[syncUserToSupabase] Error:', e);
  }
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

// Create new user (Super Admin only) - Hybrid: Supabase Auth + localStorage
export async function createUser(userData: Omit<HardcodedUser, 'id'>): Promise<HardcodedUser> {
  const newUser: HardcodedUser = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    isActive: userData.isActive ?? true, // Default to active
    schoolId: userData.schoolId || null, // Use null if no valid school UUID
  };
  
  // Try to create Supabase Auth user (for cross-device login)
  try {
    const supabase = getSupabase();
    if (supabase) {
      // Create auth user with email confirmation disabled (auto-confirm)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          },
        },
      });
      
      if (!authError && authData.user) {
        // Update the user ID to match Supabase Auth UUID
        newUser.id = authData.user.id;
        console.log('[createUser] Supabase Auth user created:', authData.user.id);
      } else if (authError) {
        // If user already exists in Auth, continue with local storage
        console.log('[createUser] Supabase Auth warning:', authError.message);
      }
    }
  } catch (e) {
    // Silent fail - localStorage backup is enough
    console.log('[createUser] Supabase Auth failed, using localStorage only:', e);
  }
  
  // Always save to localStorage as backup/fallback
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

