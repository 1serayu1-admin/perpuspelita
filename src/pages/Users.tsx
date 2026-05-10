import { useState, useEffect } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { AppRole } from '@/lib/types';
import { getRoleColor, getRoleLabel, ALL_ROLES } from '@/lib/permissions';
import { UserPlus, X } from 'lucide-react';

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
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'siswa' as AppRole,
    schoolId: currentUser?.schoolId || ''
  });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.username || !newUser.password) {
      toast.error('Semua field harus diisi');
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) {
        toast.error('Koneksi database gagal');
        return;
      }

      // Auto-generate internal email from username
      const internalEmail = `${newUser.username}@internal.local`;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: internalEmail,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role,
            username: newUser.username
          }
        }
      });

      if (authError) {
        toast.error('Gagal membuat user: ' + authError.message);
        return;
      }

      if (!authData.user) {
        toast.error('Gagal membuat user auth');
        return;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: newUser.name,
          email: internalEmail, // Use internal email
          school_id: newUser.schoolId,
          is_active: true
        });

      if (profileError) {
        toast.error('Gagal membuat profile: ' + profileError.message);
        return;
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: newUser.role,
          school_id: newUser.schoolId
        });

      if (roleError) {
        toast.error('Gagal mengatur role: ' + roleError.message);
        return;
      }

      // Success
      toast.success('User berhasil dibuat!');
      setShowAddUserModal(false);
      setNewUser({
        name: '',
        username: '',
        password: '',
        role: 'siswa' as AppRole,
        schoolId: currentUser?.schoolId || ''
      });
      
      // Refresh users list
      loadUsers();
      
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error('Terjadi kesalahan saat membuat user');
    }
  };

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
          action: 'Role Changed',
          detail: `Role ${user.email || 'user'} diubah dari ${oldRole} ke ${newRole}`,
          user_name: currentUser?.name || currentUser?.email || 'Admin',
          school_id: currentUser?.schoolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.schoolId) ? currentUser.schoolId : null,
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
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Total: {users.length} users
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              + Tambah User
            </button>
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

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Tambah User Baru</h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Masukkan nama user"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Masukkan username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Masukkan password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as AppRole})}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                    <option value="school_super_admin">Kepala Sekolah</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 border border-border rounded-lg px-4 py-2 hover:bg-muted"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
                  >
                    Simpan User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
