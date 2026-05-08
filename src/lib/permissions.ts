import type { AppRole } from "@/lib/types";

export const ROLE_LEVEL: Record<AppRole, number> = {
  global_super_admin: 5,
  school_super_admin: 4,
  admin: 3,
  guru: 2,
  siswa: 1,
};

export function canAccess(
  currentRole: AppRole,
  allowed: AppRole[]
) {
  return allowed.includes(currentRole);
}

export function canManageRole(
  actor: AppRole,
  target: AppRole
) {
  return ROLE_LEVEL[actor] > ROLE_LEVEL[target];
}

export function canEditUser(
  actor: AppRole,
  targetRole: AppRole
) {
  return ROLE_LEVEL[actor] > ROLE_LEVEL[targetRole];
}

export function getRoleColor(role: AppRole): string {
  switch (role) {
    case 'global_super_admin':
      return 'bg-red-500 text-white';
    case 'school_super_admin':
      return 'bg-purple-500 text-white';
    case 'admin':
      return 'bg-blue-500 text-white';
    case 'guru':
      return 'bg-green-500 text-white';
    case 'siswa':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

export function getRoleLabel(role: AppRole): string {
  switch (role) {
    case 'global_super_admin':
      return 'Global Super Admin';
    case 'school_super_admin':
      return 'School Super Admin';
    case 'admin':
      return 'Admin';
    case 'guru':
      return 'Guru';
    case 'siswa':
      return 'Siswa';
    default:
      return 'Unknown';
  }
}

export const ALL_ROLES: AppRole[] = [
  'global_super_admin',
  'school_super_admin', 
  'admin',
  'guru',
  'siswa'
];
