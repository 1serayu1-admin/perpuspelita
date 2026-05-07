import { useState, useEffect } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/layouts/AppLayout';

type Role = 'admin' | 'school_super_admin' | 'global_super_admin' | 'guru' | 'siswa';

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: Role;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name');

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
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, newRole: Role) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole } as any);

      // Reload users to update display
      await loadUsers();
    } catch (err) {
      console.error('Error assigning role:', err);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-4 font-semibold text-sm">Email</th>
                <th className="p-4 font-semibold text-sm">Name</th>
                <th className="p-4 font-semibold text-sm">Role</th>
                <th className="p-4 font-semibold text-sm">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm">{user.email || 'N/A'}</td>
                  <td className="p-4 text-sm">{user.name || 'N/A'}</td>
                  <td className="p-4 text-sm capitalize">{user.role}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => assignRole(user.id, e.target.value as Role)}
                      className="bg-background border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="admin">admin</option>
                      <option value="school_super_admin">school_super_admin</option>
                      <option value="guru">guru</option>
                      <option value="siswa">siswa</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="p-8 text-center text-muted-foreground">No users found.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
