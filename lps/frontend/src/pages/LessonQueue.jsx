import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import LessonCard from '../components/LessonCard';
import { getLessonPlans } from '../services/lessonPlanService';

/**
 * Generic "list of lesson plans" page used for the Department Head's
 * and Director's Pending / Approved / Rejected views. `statusFilter`
 * can be a single status or an array of statuses to match client-side.
 */
export default function LessonQueue({ title, description, statusFilter, basePath }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLessonPlans()
      .then(({ data }) => setPlans(data.lessonPlans))
      .catch(() => setError('Could not load lesson plans.'))
      .finally(() => setLoading(false));
  }, []);

  const filterList = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
  const visible = statusFilter ? plans.filter((p) => filterList.includes(p.status)) : plans;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && visible.length === 0 && <div className="empty-state">Nothing here right now.</div>}

      {visible.map((plan) => (
        <LessonCard key={plan.id} plan={plan} detailPath={`${basePath}/${plan.id}`} />
      ))}
    </DashboardLayout>
  );
}
