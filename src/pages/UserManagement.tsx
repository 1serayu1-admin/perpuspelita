import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsersList, createUser, deleteUser, updateUser, setUserActiveStatus, type HardcodedUser } from '@/services/authService';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Users, Shield, UserCircle, Power, PowerOff } from 'lucide-react';
import type { AppRole } from '@/lib/types';

const AVAILABLE_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin Perpustakaan', description: 'Kelola perpustakaan 1 sekolah' },
  { value: 'school_super_admin', label: 'Super Admin Sekolah', description: 'Akses penuh 1 sekolah' },
  { value: 'guru', label: 'Guru', description: 'Bisa pinjam buku untuk pelajaran' },
  { value: 'siswa', label: 'Siswa', description: 'Bisa pinjam buku pribadi' },
];

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<HardcodedUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<HardcodedUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin' as AppRole,
    schoolId: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getAllUsersList();
    setUsers(allUsers);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Semua field harus diisi');
      return;
    }

    // Check if email already exists
    const existing = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    if (existing) {
      toast.error('Email sudah digunakan');
      return;
    }

    try {
      createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        schoolId: formData.schoolId,
      });
      
      toast.success('User berhasil dibuat!');
      loadUsers();
      setIsCreating(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'admin',
        schoolId: 'school-001',
      });
    } catch (error) {
      toast.error('Gagal membuat user');
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Yakin hapus user "${userName}"?`)) {
      const success = deleteUser(userId);
      if (success) {
        toast.success('User dihapus');
        loadUsers();
      } else {
        toast.error('Tidak bisa hapus user ini');
      }
    }
  };

  const handleToggleActive = (userId: string, userName: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const success = setUserActiveStatus(userId, newStatus);
    if (success) {
      toast.success(`Akun "${userName}" ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadUsers();
    } else {
      toast.error('Gagal mengubah status akun');
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      updateUser(editingUser.id, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        schoolId: formData.schoolId,
      });
      
      toast.success('User diupdate!');
      loadUsers();
      setEditingUser(null);
    } catch (error) {
      toast.error('Gagal update user');
    }
  };

  const startEdit = (user: HardcodedUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId || '',
    });
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'global_super_admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'admin': return <UserCircle className="w-4 h-4 text-blue-500" />;
      case 'school_super_admin': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'guru': return <UserCircle className="w-4 h-4 text-green-500" />;
      case 'siswa': return <UserCircle className="w-4 h-4 text-gray-500" />;
      default: return <UserCircle className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: AppRole) => {
    return AVAILABLE_ROLES.find(r => r.value === role)?.label || role;
  };

  // Separate Super Admin from other users
  const superAdmin = users.find(u => u.role === 'global_super_admin');
  const otherUsers = users.filter(u => u.role !== 'global_super_admin');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
        <p className="text-gray-600 mt-1">Buat dan kelola akun untuk admin, guru, dan siswa</p>
      </div>

      {/* Super Admin Info Card */}
      {superAdmin && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h3 className="font-bold text-red-800">Super Admin (Master Account)</h3>
              <p className="text-sm text-red-600">
                {superAdmin.name} • {superAdmin.email} • Tidak bisa dihapus
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Button */}
      {!isCreating && !editingUser && (
        <button
          onClick={() => setIsCreating(true)}
          className="mb-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Buat User Baru
        </button>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingUser) && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">
            {editingUser ? 'Edit User' : 'Buat User Baru'}
          </h2>
          
          <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: admin@sekolah.id"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingUser ? 'Simpan Perubahan' : 'Buat User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingUser(null);
                  setFormData({
                    email: '',
                    password: '',
                    name: '',
                    role: 'admin',
                    schoolId: '',
                  });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar User ({otherUsers.length})
          </h3>
        </div>
        
        {otherUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada user. Buat user pertama!</p>
          </div>
        ) : (
          <div className="divide-y">
            {otherUsers.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {getRoleIcon(u.role)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {u.name}
                      {u.isActive === false && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {u.email} • {getRoleLabel(u.role)}
                    </p>
                    <p className="text-xs text-gray-400">Password: {u.password}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(u.id, u.name, u.isActive !== false)}
                    className={`p-2 rounded-lg ${u.isActive === false ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                    title={u.isActive === false ? 'Aktifkan akun' : 'Nonaktifkan akun'}
                  >
                    {u.isActive === false ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(u)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
