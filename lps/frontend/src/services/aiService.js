import api from './api';

// brief: { subject, gradeLevel, topic, duration, notes }
// Resolves to { data: { draft: { title, objective, content } } }
export const generateLessonPlanDraft = (brief) => api.post('/ai/generate-lesson-plan', brief);
