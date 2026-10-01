import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { deleteCurriculum, listCurriculum, uploadCurriculum } from '../services/curriculumService';

function timeAgo(value) {
  if (!value) return 'recently';
  const now = new Date();
  const then = new Date(value);
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

const INITIAL_FORM = { title: '', subject: '', grade_level: '', file: null };

export default function CurriculumLibrary() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    listCurriculum()
      .then(({ data }) => setDocs(data.curricula || []))
      .catch(() => setError('Could not load curriculum documents.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  }

  async function handleUpload() {
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.subject.trim() || !form.grade_level.trim()) {
      setError('Please complete title, subject, and grade level.');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('subject', form.subject.trim());
    formData.append('grade_level', form.grade_level.trim());
    if (form.file) formData.append('file', form.file);

    setUploading(true);
    try {
      await uploadCurriculum(formData);
      setSuccess('Curriculum uploaded. Teachers in your department can now use it when generating lesson plans.');
      setForm(INITIAL_FORM);
      const fileInput = document.getElementById('curriculum-file');
      if (fileInput) fileInput.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload curriculum document.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this curriculum document?')) return;
    try {
      await deleteCurriculum(id);
      setDocs((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete curriculum document.');
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Curriculum Library</h1>
          <p>Upload and manage syllabus documents teachers can use for AI-assisted lesson planning.</p>
        </div>
      </div>

      {success && <div className="success-banner">{success}</div>}
      {error && <div className="error-text">{error}</div>}

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ marginBottom: 14 }}>Upload new curriculum document</h3>
        <div className="field">
          <label htmlFor="curriculum-title">Title</label>
          <input
            id="curriculum-title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Grade 8 Biology Syllabus — Term 1 2024"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="curriculum-subject">Subject</label>
          <input
            id="curriculum-subject"
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            placeholder="e.g. Biology"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="curriculum-grade">Grade level</label>
          <input
            id="curriculum-grade"
            value={form.grade_level}
            onChange={(e) => update('grade_level', e.target.value)}
            placeholder="e.g. Grade 8"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="curriculum-file">Syllabus document (PDF or DOCX)</label>
          <input
            id="curriculum-file"
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => update('file', e.target.files?.[0] || null)}
          />
          <div className="field-hint">Text will be automatically extracted for AI use. Scanned image PDFs may not extract correctly.</div>
        </div>
        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading and extracting text…' : 'Upload curriculum'}
        </button>
      </div>

      <h3 style={{ marginBottom: 12 }}>Existing curriculum documents</h3>
      {loading && [1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}
      {!loading && docs.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📄</span>
          <div className="empty-state-title">No curriculum documents yet</div>
          <p>Upload your department's syllabus so teachers can generate AI lesson plans aligned to it.</p>
        </div>
      )}
      {docs.map((doc) => (
        <div className="card curriculum-card" key={doc.id}>
          <div>
            <div className="curriculum-title">{doc.title}</div>
            <div className="curriculum-meta">{doc.subject} · {doc.grade_level}</div>
            <div className="curriculum-meta">Uploaded {timeAgo(doc.created_at)}</div>
            {!doc.has_text && <div className="curriculum-warning">⚠ No text extracted — AI cannot use this document</div>}
          </div>
          <div className="curriculum-actions">
            <span className={`badge ${doc.is_active ? 'badge-dept_approved' : 'badge-draft'}`}>
              {doc.is_active ? 'ACTIVE' : 'SUPERSEDED'}
            </span>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)}>Delete</button>
          </div>
        </div>
      ))}
    </DashboardLayout>
  );
}
