import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const ROLE_LABELS = {
  teacher: 'Teacher',
  department_head: 'Department Head',
  director: 'Director',
};

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Your account details.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="field">
          <label>Name</label>
          <input value={user.name} disabled />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={user.email} disabled />
        </div>
        <div className="field">
          <label>Role</label>
          <input value={ROLE_LABELS[user.role] || user.role} disabled />
        </div>
        {user.department && (
          <div className="field">
            <label>Department</label>
            <input value={user.department} disabled />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
