import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { listCurriculum } from '../services/curriculumService';

function timeAgo(value) {
  if (!value) return 'recently';
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function CurriculumOverview() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listCurriculum()
      .then(({ data }) => setDocs(data.curricula || []))
      .catch(() => setError('Could not load curriculum documents.'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return docs.reduce((acc, doc) => {
      const department = doc.department || 'Unassigned';
      if (!acc[department]) acc[department] = [];
      acc[department].push(doc);
      return acc;
    }, {});
  }, [docs]);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Curriculum Overview</h1>
          <p>Read-only view of curriculum documents uploaded across departments.</p>
        </div>
      </div>

      {loading && [1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}
      {error && <p className="error-text">{error}</p>}
      {!loading && docs.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📚</span>
          <div className="empty-state-title">No curriculum uploaded yet</div>
          <p>Department curriculum documents will appear here when department heads upload them.</p>
        </div>
      )}

      {Object.entries(grouped).map(([department, items]) => (
        <section key={department} className="curriculum-group">
          <h3>{department}</h3>
          {items.map((doc) => (
            <div className="card curriculum-card" key={doc.id}>
              <div>
                <div className="curriculum-title">{doc.title}</div>
                <div className="curriculum-meta">{doc.subject} · {doc.grade_level} · Uploaded {timeAgo(doc.created_at)}</div>
                {!doc.has_text && <div className="curriculum-warning">⚠ No text extracted — AI cannot use this document</div>}
              </div>
              <span className={`badge ${doc.is_active ? 'badge-dept_approved' : 'badge-draft'}`}>
                {doc.is_active ? 'ACTIVE' : 'SUPERSEDED'}
              </span>
            </div>
          ))}
        </section>
      ))}
    </DashboardLayout>
  );
}
