import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { createLessonPlan, submitLessonPlan } from '../services/lessonPlanService';

const ACCEPTED_TYPES = '.pdf,.doc,.docx';

export default function UploadLesson() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function buildFormData() {
    const formData = new FormData();
    formData.append('title', title);
    if (file) formData.append('file', file);
    return formData;
  }

  async function handleUpload(submitAfter) {
    setError('');
    if (!title) {
      setError('Please give the lesson plan a title.');
      return;
    }
    if (!file) {
      setError('Please choose a PDF or DOCX file to upload.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await createLessonPlan(buildFormData());
      if (submitAfter) {
        await submitLessonPlan(data.lessonPlan.id);
      }
      navigate(`/teacher/plans/${data.lessonPlan.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload the lesson plan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Upload lesson plan</h1>
          <p>Attach a PDF or Word document instead of typing the lesson plan in directly.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {error && <div className="error-text">{error}</div>}
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 4 — Photosynthesis"
          />
        </div>
        <div className="field">
          <label htmlFor="file">File (PDF or DOCX)</label>
          <input
            id="file"
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>
              Selected: {file.name}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => handleUpload(false)} disabled={submitting}>
            Save as draft
          </button>
          <button className="btn btn-primary" onClick={() => handleUpload(true)} disabled={submitting}>
            Save and submit for review
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
