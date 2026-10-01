import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  getLessonPlan,
  updateLessonPlan,
  submitLessonPlan,
  departmentReview,
  directorReview,
} from '../services/lessonPlanService';

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending department head review',
  dept_approved: 'Approved by department head — awaiting director',
  dept_rejected: 'Rejected by department head',
  director_approved: 'Final approved',
  director_rejected: 'Rejected by director',
};

export default function LessonDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState(false);

  // Editable copy for teachers revising a rejected plan.
  const [editForm, setEditForm] = useState({ title: '', objective: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);

  function load() {
    setLoading(true);
    getLessonPlan(id)
      .then(({ data }) => {
        setPlan(data.lessonPlan);
        setReviews(data.reviews);
        setEditForm({
          title: data.lessonPlan.title,
          objective: data.lessonPlan.objective || '',
          content: data.lessonPlan.content || '',
        });
      })
      .catch(() => setError('Could not load this lesson plan.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleReview(action) {
    setActing(true);
    try {
      if (user.role === 'department_head') {
        await departmentReview(id, action, comment);
      } else if (user.role === 'director') {
        await directorReview(id, action, comment);
      }
      setComment('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit your review.');
    } finally {
      setActing(false);
    }
  }

  async function handleSaveEdit() {
    setActing(true);
    try {
      await updateLessonPlan(id, editForm);
      setIsEditing(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setActing(false);
    }
  }

  async function handleResubmit() {
    setActing(true);
    try {
      await submitLessonPlan(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not resubmit this lesson plan.');
    } finally {
      setActing(false);
    }
  }

  if (loading) return <DashboardLayout><p>Loading...</p></DashboardLayout>;
  if (error) return <DashboardLayout><p className="error-text">{error}</p></DashboardLayout>;
  if (!plan) return null;

  const isOwner = user.role === 'teacher' && plan.teacher_id === user.id;
  const canDeptReview = user.role === 'department_head' && plan.current_stage === 'with_department_head';
  const canDirectorReview = user.role === 'director' && plan.current_stage === 'with_director';
  const canRevise = isOwner && ['dept_rejected', 'director_rejected'].includes(plan.status);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>{plan.title}</h1>
          <p>
            {plan.teacher_name && <>By {plan.teacher_name} · </>}
            {STATUS_LABELS[plan.status]}
          </p>
        </div>
        <span className={`badge badge-${plan.status}`}>{plan.status.replace(/_/g, ' ')}</span>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        {!isEditing ? (
          <>
            <h3 style={{ marginBottom: 8 }}>Objective</h3>
            <p style={{ marginBottom: 18, color: 'var(--color-text-muted)' }}>
              {plan.objective || 'No objective provided.'}
            </p>
            <h3 style={{ marginBottom: 8 }}>Content</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)' }}>
              {plan.content || 'No written content — see attached file.'}
            </p>
            {plan.file_url && (
              <p style={{ marginTop: 14 }}>
                <a
                  href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${plan.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View attached file
                </a>
              </p>
            )}

            {canRevise && (
              <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  Edit lesson plan
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="field">
              <label>Title</label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Objective</label>
              <textarea
                value={editForm.objective}
                onChange={(e) => setEditForm((f) => ({ ...f, objective: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Content</label>
              <textarea
                style={{ minHeight: 160 }}
                value={editForm.content}
                onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={acting}>
                Save changes
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={acting}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {canRevise && !isEditing && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p style={{ marginBottom: 12 }}>
            Once you've made your revisions, resubmit this lesson plan for department head review.
          </p>
          <button className="btn btn-success" onClick={handleResubmit} disabled={acting}>
            Resubmit for review
          </button>
        </div>
      )}

      {(canDeptReview || canDirectorReview) && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h3 style={{ marginBottom: 12 }}>Your review</h3>
          <div className="field">
            <label>Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add feedback for the teacher..."
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-success" onClick={() => handleReview('approved')} disabled={acting}>
              Approve
            </button>
            <button className="btn btn-danger" onClick={() => handleReview('rejected')} disabled={acting}>
              Reject
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Review history</h3>
        {reviews.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet.</p>
        )}
        {reviews.map((r) => (
          <div className="comment-block" key={r.id}>
            <div className="comment-meta">
              {r.reviewer_name} ({r.role.replace('_', ' ')}) ·{' '}
              <strong style={{ color: r.action === 'approved' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {r.action}
              </strong>{' '}
              · {new Date(r.review_date).toLocaleString()}
            </div>
            {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 18 }}>
        <Link to="..">&larr; Back</Link>
      </p>
    </DashboardLayout>
  );
}
