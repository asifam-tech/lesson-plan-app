import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENUS = {
  teacher: [
    { to: '/teacher', label: 'Dashboard' },
    { to: '/teacher/create', label: 'Create Lesson Plan' },
    { to: '/teacher/upload', label: 'Upload Lesson Plan' },
    { to: '/teacher/my-plans', label: 'My Lesson Plans' },
    { to: '/teacher/notifications', label: 'Notifications' },
    { to: '/teacher/profile', label: 'Profile' },
  ],
  department_head: [
    { to: '/department', label: 'Dashboard' },
    { to: '/department/pending', label: 'Pending Lesson Plans' },
    { to: '/department/approved', label: 'Approved Plans' },
    { to: '/department/rejected', label: 'Rejected Plans' },
    { to: '/department/reports', label: 'Reports' },
    { to: '/department/profile', label: 'Profile' },
  ],
  director: [
    { to: '/director', label: 'Dashboard' },
    { to: '/director/pending', label: 'Pending Approval' },
    { to: '/director/approved', label: 'Approved Plans' },
    { to: '/director/rejected', label: 'Rejected Plans' },
    { to: '/director/reports', label: 'Reports' },
    { to: '/director/profile', label: 'Profile' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const items = MENUS[user.role] || [];

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">Lesson Plans</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
