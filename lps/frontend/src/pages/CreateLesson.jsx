import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { createLessonPlan, submitLessonPlan } from '../services/lessonPlanService';
import { generateLessonPlanDraft } from '../services/aiService';

 const initialBrief = { subject: '', gradeLevel: '', topic: '', duration: '', notes: '' };

export default function CreateLesson() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', objective: '', content: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showAssistant, setShowAssistant] = useState(true);
  const [brief, setBrief] = useState(initialBrief);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateBrief(field, value) {
    setBrief((b) => ({ ...b, [field]: value }));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setAiError('');
    setGenerating(true);
    try {
      const { data } = await generateLessonPlanDraft(brief);
      setForm({
        title: data.draft.title,
        objective: data.draft.objective,
        content: data.draft.content,
      });
      setHasGenerated(true);
    } catch (err) {
      setAiError(err.response?.data?.message || 'Could not generate a lesson plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await createLessonPlan(form);
      navigate(`/teacher/plans/${data.lessonPlan.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the lesson plan.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveAndSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await createLessonPlan(form);
      await submitLessonPlan(data.lessonPlan.id);
      navigate(`/teacher/plans/${data.lessonPlan.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit the lesson plan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Create lesson plan</h1>
          <p>Write your lesson plan directly, use the AI assistant to draft one, or use Upload Lesson Plan for a PDF/DOCX file instead.</p>
        </div>
      </div>

      {showAssistant && (
        <div className="card ai-assistant-card" style={{ maxWidth: 640, marginBottom: 20 }}>
          <div className="ai-assistant-header">
            <div>
              <h3 className="ai-assistant-title">✨ AI lesson plan assistant</h3>
              <p className="ai-assistant-subtitle">
                Describe the lesson and let AI draft the title, objective, and content below for you to review and edit.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAssistant(false)}
            >
              Hide
            </button>
          </div>

          {aiError && <div className="error-text">{aiError}</div>}

          <form onSubmit={handleGenerate}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="ai-subject">Subject</label>
                <input
                  id="ai-subject"
                  value={brief.subject}
                  onChange={(e) => updateBrief('subject', e.target.value)}
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="ai-grade">Grade / level</label>
                <input
                  id="ai-grade"
                  value={brief.gradeLevel}
                  onChange={(e) => updateBrief('gradeLevel', e.target.value)}
                  placeholder="e.g. Grade 6"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="ai-topic">Topic</label>
              <input
                id="ai-topic"
                value={brief.topic}
                onChange={(e) => updateBrief('topic', e.target.value)}
                placeholder="e.g. Adding and subtracting fractions"
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="ai-duration">Duration</label>
                <input
                  id="ai-duration"
                  value={brief.duration}
                  onChange={(e) => updateBrief('duration', e.target.value)}
                  placeholder="e.g. 45 minutes"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="ai-notes">Anything else the AI should know (optional)</label>
              <textarea
                id="ai-notes"
                value={brief.notes}
                onChange={(e) => updateBrief('notes', e.target.value)}
                placeholder="e.g. include a group activity, students have access to tablets, focus on visual learners..."
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={generating || !brief.subject || !brief.topic}>
              {generating ? 'Generating…' : hasGenerated ? 'Regenerate' : 'Generate lesson plan'}
            </button>
          </form>
        </div>
      )}

      {!showAssistant && (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginBottom: 20 }}
          onClick={() => setShowAssistant(true)}
        >
          ✨ Use AI assistant
        </button>
      )}

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="error-text">{error}</div>}
        {hasGenerated && (
          <div className="ai-generated-note">
            Drafted with AI — review and edit before saving.
          </div>
        )}
        <form>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Introduction to Fractions"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="objective">Objective</label>
            <textarea
              id="objective"
              value={form.objective}
              onChange={(e) => update('objective', e.target.value)}
              placeholder="What should students be able to do by the end of this lesson?"
            />
          </div>
          <div className="field">
            <label htmlFor="content">Lesson content</label>
            <textarea
              id="content"
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder="Outline activities, materials, and timing."
              style={{ minHeight: 180 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleSave} disabled={submitting || !form.title}>
              Save as draft
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveAndSubmit}
              disabled={submitting || !form.title}
            >
              Save and submit for review
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
