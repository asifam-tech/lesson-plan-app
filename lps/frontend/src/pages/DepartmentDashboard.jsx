import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import LessonCard from '../components/LessonCard';
import { getLessonPlans } from '../services/lessonPlanService';
import { useAuth } from '../context/AuthContext';

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessonPlans()
      .then(({ data }) => setPlans(data.lessonPlans))
      .finally(() => setLoading(false));
  }, []);

  const pending = plans.filter((p) => p.current_stage === 'with_department_head');
  const approved = plans.filter((p) => ['dept_approved', 'director_approved', 'director_rejected'].includes(p.status));
  const rejected = plans.filter((p) => p.status === 'dept_rejected');

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Department Head dashboard</h1>
          <p>{user?.department} department — lesson plans awaiting your review.</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-number">{pending.length}</div>
          <div className="stat-label">Pending your review</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{approved.length}</div>
          <div className="stat-label">Approved by you</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{rejected.length}</div>
          <div className="stat-label">Rejected by you</div>
        </div>
      </div>
      <h3 style={{ marginBottom: 12 }}>Awaiting your review</h3>
      {loading && <p>Loading...</p>}
      {!loading && pending.length === 0 && <div className="empty-state">Nothing pending right now.</div>}
      {pending.map((plan) => (
        <LessonCard key={plan.id} plan={plan} detailPath={`/department/plans/${plan.id}`} />
      ))}
    </DashboardLayout>
  );
}
