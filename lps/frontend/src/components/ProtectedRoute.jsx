import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a page element. Redirects to /login if not authenticated,
 * and to a sensible default dashboard if the role doesn't match
 * the allowed list for this route.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${roleHome(user.role)}`} replace />;
  }

  return children;
}

export function roleHome(role) {
  switch (role) {
    case 'teacher':
      return 'teacher';
    case 'department_head':
      return 'department';
    case 'director':
      return 'director';
    default:
      return 'login';
  }
}
