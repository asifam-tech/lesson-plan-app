import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import LessonCard from '../components/LessonCard';
import { getLessonPlans, deleteLessonPlan, submitLessonPlan } from '../services/lessonPlanService';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'pending', label: 'Pending' },
  { key: 'dept_approved', label: 'Approved by Dept. Head' },
  { key: 'director_approved', label: 'Final Approved' },
  { key: 'dept_rejected', label: 'Rejected by Dept. Head' },
  { key: 'director_rejected', label: 'Rejected by Director' },
];

export default function MyLessonPlans() {
  const [plans, setPlans] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    getLessonPlans()
      .then(({ data }) => setPlans(data.lessonPlans))
      .catch(() => setError('Could not load your lesson plans.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    try {
      await deleteLessonPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete this lesson plan.');
    }
  }

  async function handleSubmit(id) {
    try {
      await submitLessonPlan(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit this lesson plan.');
    }
  }

  const visiblePlans = filter === 'all' ? plans : plans.filter((p) => p.status === filter);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>My lesson plans</h1>
          <p>Every lesson plan you've created, with its current approval status.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setFilter(f.key)}
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && visiblePlans.length === 0 && (
        <div className="empty-state">No lesson plans in this category.</div>
      )}

      {visiblePlans.map((plan) => (
        <LessonCard
          key={plan.id}
          plan={plan}
          detailPath={`/teacher/plans/${plan.id}`}
          actions={
            <>
              {plan.status === 'draft' && (
                <>
                  <button className="btn btn-success" onClick={() => handleSubmit(plan.id)}>
                    Submit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(plan.id)}>
                    Delete
                  </button>
                </>
              )}
              {['dept_rejected', 'director_rejected'].includes(plan.status) && (
                <Link className="btn btn-success" to={`/teacher/plans/${plan.id}`}>
                  Revise &amp; resubmit
                </Link>
              )}
            </>
          }
        />
      ))}
    </DashboardLayout>
  );
}
