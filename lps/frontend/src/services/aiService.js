// import api from './api';

// // brief: { subject, gradeLevel, topic, duration, notes }
// // Resolves to { data: { draft: { title, objective, content } } }
// export const generateLessonPlanDraft = (brief) => api.post('/ai/generate-lesson-plan', brief);
import api from './api';

export const generateLessonFromAI = (prompt) => {
  return api.post('/ai/generate-lesson-plan', {
    prompt,
  });
};

export const generateLessonPlanDraft = (brief) => {
  return api.post('/ai/generate-lesson-plan', brief);
};