import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getReportSummary } from '../services/miscService';

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  dept_approved: 'Approved by Dept. Head',
  dept_rejected: 'Rejected by Dept. Head',
  director_approved: 'Final Approved',
  director_rejected: 'Rejected by Director',
};

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getReportSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Could not load report data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Lesson plan activity at a glance.</p>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {summary && (
        <>
          <h3 style={{ marginBottom: 12 }}>By status</h3>
          <div className="stat-grid">
            {summary.statusBreakdown.map((row) => (
              <div className="stat-box" key={row.status}>
                <div className="stat-number">{row.count}</div>
                <div className="stat-label">{STATUS_LABELS[row.status] || row.status}</div>
              </div>
            ))}
            {summary.statusBreakdown.length === 0 && (
              <div className="empty-state">No lesson plan data yet.</div>
            )}
          </div>

          <h3 style={{ marginBottom: 12 }}>By teacher</h3>
          <div className="card">
            {summary.byTeacher.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)' }}>No submissions yet.</p>
            )}
            {summary.byTeacher.map((row) => (
              <div
                key={row.teacher_name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span>{row.teacher_name}</span>
                <strong>{row.count}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
