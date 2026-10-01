import api from './api';

export const checkCurriculum = (subject, grade_level) =>
  api.get('/curriculum/check', { params: { subject, grade_level } });

export const getCurriculumText = (id) => api.get(`/curriculum/${id}/text`);

export const listCurriculum = () => api.get('/curriculum');

export const uploadCurriculum = (formData) =>
  api.post('/curriculum', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteCurriculum = (id) => api.delete(`/curriculum/${id}`);

export const extractSessionCurriculum = (formData) =>
  api.post('/curriculum/extract-session', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
