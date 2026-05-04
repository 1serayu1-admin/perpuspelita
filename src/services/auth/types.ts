import { AppRole } from '@/lib/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginWithUsernameCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  appRole: AppRole;
  avatar?: string;
  schoolId?: string;
}

export interface SessionInfo {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
}
