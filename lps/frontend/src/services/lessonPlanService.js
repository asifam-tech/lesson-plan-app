import api from './api';

export const getLessonPlans = (status) =>
  api.get('/lesson-plans', { params: status ? { status } : {} });

export const getLessonPlan = (id) => api.get(`/lesson-plans/${id}`);

export const createLessonPlan = (formData) =>
  api.post('/lesson-plans', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateLessonPlan = (id, formData) =>
  api.put(`/lesson-plans/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteLessonPlan = (id) => api.delete(`/lesson-plans/${id}`);

export const submitLessonPlan = (id) => api.post(`/lesson-plans/${id}/submit`);

export const departmentReview = (id, action, comment) =>
  api.post(`/lesson-plans/${id}/department-review`, { action, comment });

export const directorReview = (id, action, comment) =>
  api.post(`/lesson-plans/${id}/director-review`, { action, comment });
