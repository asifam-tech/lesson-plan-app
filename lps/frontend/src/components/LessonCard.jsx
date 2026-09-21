import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  dept_approved: 'Approved by Dept. Head',
  dept_rejected: 'Rejected by Dept. Head',
  director_approved: 'Final Approved',
  director_rejected: 'Rejected by Director',
};

export default function LessonCard({ plan, detailPath, actions }) {
  return (
    <div className="lesson-card">
      <div>
        <div className="lesson-card-title">{plan.title}</div>
        <div className="lesson-card-meta">
          {plan.teacher_name && <>By {plan.teacher_name} · </>}
          {plan.department && <>{plan.department} · </>}
          Last updated {new Date(plan.updated_at).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={`badge badge-${plan.status}`}>
          {STATUS_LABELS[plan.status] || plan.status}
        </span>
        {detailPath && (
          <Link className="btn btn-secondary" to={detailPath}>
            View
          </Link>
        )}
        {actions}
      </div>
    </div>
  );
}
