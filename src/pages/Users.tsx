import { useState, useEffect } from 'react';
import { getSupabase } from '@/integrations/supabase/client';

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
              .single();

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
    <div style={{ padding: 20 }}>
      <h1>User Management</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: 10 }}>Email</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Name</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Role</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 10 }}>{user.email || 'N/A'}</td>
              <td style={{ padding: 10 }}>{user.name || 'N/A'}</td>
              <td style={{ padding: 10 }}>{user.role}</td>
              <td style={{ padding: 10 }}>
                <select
                  value={user.role}
                  onChange={(e) => assignRole(user.id, e.target.value as Role)}
                  style={{ padding: 5 }}
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

      {users.length === 0 && <p>No users found.</p>}
    </div>
  );
}
