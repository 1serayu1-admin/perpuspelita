import { useLocation } from 'react-router-dom';

export function AppSidebar() {
  const location = useLocation();

  const user = null;

  return (
    <div style={{ width: 200, padding: 10 }}>
      <h2>Sidebar</h2>
      <p>Path: {location.pathname}</p>
      <p>User: {user ? 'EXISTS' : 'NONE'}</p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>Dashboard</li>
        <li>Books</li>
        <li>Students</li>
      </ul>
    </div>
  );
}

export function MobileSidebarTrigger() {
  return null;
}
