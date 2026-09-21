import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  teacher: 'Teacher',
  department_head: 'Department Head',
  director: 'Director',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div />
      {user && (
        <div className="navbar-user">
          <span>{user.name}</span>
          <span className="navbar-role">{ROLE_LABELS[user.role] || user.role}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
