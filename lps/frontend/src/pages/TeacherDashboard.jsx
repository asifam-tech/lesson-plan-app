import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import LessonCard from '../components/LessonCard';
import { getLessonPlans } from '../services/lessonPlanService';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLessonPlans()
      .then(({ data }) => setPlans(data.lessonPlans))
      .catch(() => setError('Could not load your lesson plans.'))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    draft: plans.filter((p) => p.status === 'draft').length,
    pending: plans.filter((p) => p.status === 'pending').length,
    approved: plans.filter((p) => p.status === 'director_approved').length,
    rejected: plans.filter((p) => ['dept_rejected', 'director_rejected'].includes(p.status)).length,
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
          <p>Here's where your lesson plans stand right now.</p>
        </div>
        <Link to="/teacher/create" className="btn btn-primary">
          + Create Lesson Plan
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-number">{counts.draft}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{counts.pending}</div>
          <div className="stat-label">Pending review</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{counts.approved}</div>
          <div className="stat-label">Final approved</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{counts.rejected}</div>
          <div className="stat-label">Needs revision</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Recent activity</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && plans.length === 0 && (
        <div className="empty-state">
          You haven't created any lesson plans yet. <Link to="/teacher/create">Create one</Link> to get
          started.
        </div>
      )}
      {plans.slice(0, 6).map((plan) => (
        <LessonCard key={plan.id} plan={plan} detailPath={`/teacher/plans/${plan.id}`} />
      ))}
    </DashboardLayout>
  );
}
