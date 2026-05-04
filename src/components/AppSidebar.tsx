import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AppSidebar() {
  const location = useLocation();
  const { role } = useAuth();

  const menuItems = [
    { label: 'Dashboard', roles: ['admin', 'school_super_admin'] },
    { label: 'Books', roles: ['admin', 'guru'] },
    { label: 'Students', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item =>
    item.roles.includes(role)
  );

  return (
    <div style={{ width: 200, padding: 10 }}>
      <h2>Sidebar</h2>
      <p>Path: {location.pathname}</p>
      <p>Role: {role || 'NONE'}</p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredMenu.map((item, index) => (
          <li key={index}>{item.label}</li>
        ))}
      </ul>
    </div>
  );
}

export function MobileSidebarTrigger() {
  return null;
}
