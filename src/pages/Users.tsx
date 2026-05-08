import { useState, useEffect } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { AppRole } from '@/lib/types';
import { getRoleColor, getRoleLabel, ALL_ROLES } from '@/lib/permissions';

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: AppRole;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // ALLOWED ROLES: global_super_admin (all schools) + school_super_admin (own school only)
  if (!['global_super_admin', 'school_super_admin'].includes(currentUser?.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  // SAFETY CHECK: school_super_admin must have schoolId
  if (currentUser?.role === 'school_super_admin' && !currentUser?.schoolId) {
    console.warn('school_super_admin missing schoolId - access denied');
    toast.error('Akses ditolak: User tidak memiliki sekolah yang terkait');
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      // Build query with school scope filtering
      let query = supabase
        .from('profiles')
        .select('id, email, name, school_id');

      // Apply school scope for school_super_admin
      if (currentUser?.role === 'school_super_admin') {
        query = query.eq('school_id', currentUser?.schoolId);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Fetch roles for each user
        const usersWithRoles = await Promise.all(
          data.map(async (user: any) => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();

            return {
              ...user,
              role: roleData?.role || 'siswa',
            };
          })
        );

        setUsers(usersWithRoles);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Gagal memuat data users');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, user: User, newRole: AppRole) => {
    setUpdating(userId);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const oldRole = user.role || 'siswa';

      // Update role
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole,
          updated_at: new Date().toISOString(),
          assigned_by: currentUser?.id
        } as any);

      if (error) throw error;

      // Add audit log
      await supabase
        .from('activity_logs')
        .insert({
          action: 'role_changed',
          message: `Changed role ${user.email} from ${oldRole} to ${newRole}`,
          user_id: currentUser?.id,
          target_user_id: userId,
          created_at: new Date().toISOString()
        });

      toast.success(`Role ${user.email} berhasil diubah ke ${getRoleLabel(newRole)}`);
      
      // Reload users to update display
      await loadUsers();
    } catch (err) {
      console.error('Error assigning role:', err);
      toast.error('Gagal mengubah role');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="text-sm text-muted-foreground">
            Total: {users.length} users
          </div>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-4 font-semibold text-sm">Email</th>
                <th className="p-4 font-semibold text-sm">Name</th>
                <th className="p-4 font-semibold text-sm">Current Role</th>
                <th className="p-4 font-semibold text-sm">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm">{user.email || 'N/A'}</td>
                  <td className="p-4 text-sm">{user.name || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role || 'siswa')}`}>
                      {getRoleLabel(user.role || 'siswa')}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role || 'siswa'}
                      onChange={(e) => assignRole(user.id, user, e.target.value as AppRole)}
                      disabled={updating === user.id}
                      className="bg-background border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    >
                      {ALL_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                    {updating === user.id && (
                      <span className="ml-2 text-xs text-muted-foreground">Updating...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">No users found.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
