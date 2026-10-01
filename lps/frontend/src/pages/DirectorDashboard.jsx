import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import LessonCard from '../components/LessonCard';
import { getLessonPlans } from '../services/lessonPlanService';

export default function DirectorDashboard() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessonPlans()
      .then(({ data }) => setPlans(data.lessonPlans))
      .finally(() => setLoading(false));
  }, []);

  const pending = plans.filter((p) => p.current_stage === 'with_director');
  const approved = plans.filter((p) => p.status === 'director_approved');
  const rejected = plans.filter((p) => p.status === 'director_rejected');

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Director dashboard</h1>
          <p>Lesson plans that have cleared department head review.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-number">{pending.length}</div>
          <div className="stat-label">Awaiting your approval</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{approved.length}</div>
          <div className="stat-label">Final approved</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{rejected.length}</div>
          <div className="stat-label">Rejected by you</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Awaiting your approval</h3>
      {loading && <p>Loading...</p>}
      {!loading && pending.length === 0 && <div className="empty-state">Nothing pending right now.</div>}
      {pending.map((plan) => (
        <LessonCard key={plan.id} plan={plan} detailPath={`/director/plans/${plan.id}`} />
      ))}
    </DashboardLayout>
  );
}
