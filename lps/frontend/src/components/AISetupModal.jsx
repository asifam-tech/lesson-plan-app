import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  checkCurriculum,
  extractSessionCurriculum,
  getCurriculumText,
} from '../services/curriculumService';
import { buildLessonPrompt } from '../utils/buildLessonPrompt';
import { generateLessonFromAI } from '../services/aiService';

const APPROACHES = ['Mixed', 'Discussion-based', 'Activity-based', 'Direct instruction'];

function RadioChoice({ checked, onChange, children }) {
  return (
    <label className={`ai-choice${checked ? ' selected' : ''}`}>
      <input type="radio" checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

export default function AISetupModal({ onClose }) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState('45');
  const [specificFocus, setSpecificFocus] = useState('');
  const [teachingApproach, setTeachingApproach] = useState('Mixed');

  const [checking, setChecking] = useState(false);
  const [curriculumCheck, setCurriculumCheck] = useState(null);
  const [curriculumSource, setCurriculumSource] = useState('general_knowledge');
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [sessionFile, setSessionFile] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [warning, setWarning] = useState('');

  const canGenerate = topic.trim() && subject.trim() && gradeLevel.trim();
  const showCurriculumStep = subject.trim() && gradeLevel.trim();

  useEffect(() => {
    if (!showCurriculumStep) {
      setCurriculumCheck(null);
      setCurriculumSource('general_knowledge');
      setSelectedCurriculumId(null);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setChecking(true);
      setGenerationError('');
      try {
        const { data } = await checkCurriculum(subject.trim(), gradeLevel.trim());
        setCurriculumCheck(data);
        if (data.match === 'exact') {
          setCurriculumSource('department_curriculum');
          setSelectedCurriculumId(data.curriculum.id);
        } else {
          setCurriculumSource('general_knowledge');
          setSelectedCurriculumId(data.curricula?.[0]?.id || null);
        }
      } catch {
        setCurriculumCheck({ match: 'none' });
        setCurriculumSource('general_knowledge');
        setSelectedCurriculumId(null);
      } finally {
        setChecking(false);
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [subject, gradeLevel, showCurriculumStep]);

  const selectedPartialDoc = useMemo(() => {
    if (curriculumCheck?.match !== 'partial') return null;
    return curriculumCheck.curricula?.find((doc) => doc.id === selectedCurriculumId) || curriculumCheck.curricula?.[0] || null;
  }, [curriculumCheck, selectedCurriculumId]);

  async function fetchCurriculumText() {
    if (curriculumSource === 'department_curriculum' && selectedCurriculumId) {
      const { data } = await getCurriculumText(selectedCurriculumId);
      return data.extracted_text || null;
    }

    if (curriculumSource === 'teacher_upload' && sessionFile) {
      const formData = new FormData();
      formData.append('file', sessionFile);
      const { data } = await extractSessionCurriculum(formData);
      if (!data.extracted_text) {
        setWarning('Could not read the uploaded file — switching to general knowledge.');
        setCurriculumSource('general_knowledge');
        return null;
      }
      return data.extracted_text;
    }

    return null;
  }

  async function handleGenerate() {
    if (!canGenerate) return;

    setGenerationError('');
    setWarning('');
    setGenerating(true);

    try {
      let effectiveSource = curriculumSource;
      let curriculumText = null;

      try {
        curriculumText = await fetchCurriculumText();
        if (!curriculumText && curriculumSource !== 'general_knowledge') {
          effectiveSource = 'general_knowledge';
          setCurriculumSource('general_knowledge');
        }
      } catch {
        effectiveSource = 'general_knowledge';
        setCurriculumSource('general_knowledge');
        setWarning('Could not load curriculum text — switching to general knowledge.');
      }

      const prompt = buildLessonPrompt({
        topic: topic.trim(),
        subject: subject.trim(),
        grade_level: gradeLevel.trim(),
        duration_minutes: duration || '45',
        specific_focus: specificFocus.trim(),
        teaching_approach: teachingApproach,
        curriculum_text: curriculumText,
        curriculum_source: effectiveSource,
      });

      const { data } = await generateLessonFromAI(prompt);
      const parsed = data.lessonPlan;

      if (!parsed) {
        setGenerationError('The AI returned an unexpected response. Try again or write manually.');
        setGenerating(false);
        return;
      }

      navigate('/teacher/create', {
        state: {
          prefill: {
            ...parsed,
            subject: subject.trim(),
            grade_level: gradeLevel.trim(),
            duration_minutes: duration || '45',
          },
          aiAssisted: true,
          curriculumSource: effectiveSource,
          curriculumDocId: effectiveSource === 'department_curriculum' ? selectedCurriculumId : null,
        },
      });
    } catch (err) {
      setGenerationError(err.response?.data?.message || 'Could not generate the lesson plan. Try again or write manually.');
      setGenerating(false);
    }
  }

  function skipManual() {
    navigate('/teacher/create?manual=true');
  }

  if (generating) {
    return (
      <div className="ai-modal-backdrop" role="dialog" aria-modal="true" aria-label="Generating lesson plan">
        <div className="ai-modal-card">
          <div className="ai-generating-screen">
            <div className="ai-spinner" />
            <p className="ai-generating-title">Preparing your lesson plan…</p>
            <p className="ai-generating-sub">
              {curriculumSource === 'general_knowledge'
                ? 'Using general educational knowledge'
                : curriculumSource === 'teacher_upload'
                  ? 'Using your uploaded curriculum as reference'
                  : "Using your department's curriculum as reference"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-modal-backdrop" role="dialog" aria-modal="true" aria-label="AI lesson plan setup">
      <div className="ai-modal-card">
        <div className="ai-modal-header">
          <div>
            <span className="ai-kicker">✨ AI Lesson Builder</span>
            <h2>Start with a smart draft</h2>
            <p>Answer a few basics, then review and edit the generated plan before submitting.</p>
          </div>
          <button className="ai-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {warning && <div className="field-warning">{warning}</div>}
        {generationError && <div className="error-text">{generationError}</div>}

        <div className="ai-step-card">
          <div className="lesson-section-header">
            <span className="section-num">01</span>
            <span className="section-name">Lesson basics</span>
          </div>
          <div className="field">
            <label htmlFor="ai-topic">Topic *</label>
            <input id="ai-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" />
          </div>
          <div className="field">
            <label htmlFor="ai-subject">Subject *</label>
            <input id="ai-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology" />
          </div>
          <div className="field">
            <label htmlFor="ai-grade">Grade / Year *</label>
            <input id="ai-grade" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="e.g. Grade 8" />
          </div>
          <div className="field">
            <label htmlFor="ai-duration">Duration</label>
            <div className="input-with-suffix">
              <input id="ai-duration" type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
              <span className="input-suffix">minutes</span>
            </div>
          </div>
        </div>

        {showCurriculumStep && (
          <div className="ai-step-card fade-in">
            <div className="lesson-section-header">
              <span className="section-num">02</span>
              <span className="section-name">Curriculum context</span>
            </div>

            {checking && <p className="ai-muted">Checking your department curriculum…</p>}

            {!checking && curriculumCheck?.match === 'exact' && (
              <div className="ai-context-box success">
                <strong>✅ Department curriculum found</strong>
                <p>“{curriculumCheck.curriculum.title}”</p>
                <p>AI will use this as context for your lesson plan.</p>
                <div className="ai-choice-row">
                  <RadioChoice
                    checked={curriculumSource === 'department_curriculum'}
                    onChange={() => {
                      setCurriculumSource('department_curriculum');
                      setSelectedCurriculumId(curriculumCheck.curriculum.id);
                    }}
                  >
                    Use department curriculum
                  </RadioChoice>
                  <RadioChoice checked={curriculumSource === 'general_knowledge'} onChange={() => setCurriculumSource('general_knowledge')}>
                    Use general knowledge
                  </RadioChoice>
                </div>
              </div>
            )}

            {!checking && curriculumCheck?.match === 'partial' && (
              <div className="ai-context-box info">
                <strong>📄 Curriculum available (different grade)</strong>
                <p>Your department has a {subject} curriculum but not for {gradeLevel} specifically.</p>
                {selectedPartialDoc && <p>Closest available: “{selectedPartialDoc.title}” ({selectedPartialDoc.grade_level})</p>}
                <div className="ai-choice-row vertical">
                  <RadioChoice
                    checked={curriculumSource === 'department_curriculum'}
                    onChange={() => {
                      setCurriculumSource('department_curriculum');
                      setSelectedCurriculumId(selectedPartialDoc?.id || null);
                    }}
                  >
                    Use {subject} curriculum anyway
                  </RadioChoice>
                  <RadioChoice checked={curriculumSource === 'teacher_upload'} onChange={() => setCurriculumSource('teacher_upload')}>
                    Upload a document for this session
                  </RadioChoice>
                  <RadioChoice checked={curriculumSource === 'general_knowledge'} onChange={() => setCurriculumSource('general_knowledge')}>
                    Use general knowledge
                  </RadioChoice>
                </div>
              </div>
            )}

            {!checking && curriculumCheck?.match === 'none' && (
              <div className="ai-context-box info">
                <strong>ℹ No department curriculum found for {gradeLevel} {subject}.</strong>
                <div className="ai-choice-row">
                  <RadioChoice checked={curriculumSource === 'teacher_upload'} onChange={() => setCurriculumSource('teacher_upload')}>
                    Upload a document for this session
                  </RadioChoice>
                  <RadioChoice checked={curriculumSource === 'general_knowledge'} onChange={() => setCurriculumSource('general_knowledge')}>
                    Use general knowledge
                  </RadioChoice>
                </div>
              </div>
            )}

            {curriculumSource === 'teacher_upload' && (
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="ai-session-file">Upload syllabus (PDF or DOCX) — used only for this lesson plan</label>
                <input id="ai-session-file" type="file" accept=".pdf,.docx" onChange={(e) => setSessionFile(e.target.files?.[0] || null)} />
                {sessionFile && <div className="field-hint">Selected: {sessionFile.name} ✓</div>}
              </div>
            )}
          </div>
        )}

        <div className="ai-step-card">
          <div className="lesson-section-header">
            <span className="section-num">03</span>
            <span className="section-name">Teaching preferences</span>
          </div>
          <div className="field">
            <label htmlFor="ai-focus">Any specific focus for this lesson? (optional)</label>
            <textarea
              id="ai-focus"
              value={specificFocus}
              onChange={(e) => setSpecificFocus(e.target.value)}
              placeholder="e.g. Students struggled with cell division last week"
            />
          </div>
          <div className="field">
            <label>Preferred teaching approach</label>
            <div className="ai-approach-grid">
              {APPROACHES.map((approach) => (
                <RadioChoice key={approach} checked={teachingApproach === approach} onChange={() => setTeachingApproach(approach)}>
                  {approach}
                </RadioChoice>
              ))}
            </div>
          </div>
        </div>

        <div className="ai-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-ghost" onClick={skipManual}>Skip AI — write manually</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={!canGenerate}>
            ✨ Generate lesson plan →
          </button>
        </div>
      </div>
    </div>
  );
}
