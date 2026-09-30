const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadCurriculum,
  listCurriculum,
  getCurriculumText,
  deleteCurriculum,
  checkCurriculum,
  extractSession,
} = require('../controllers/curriculumController');

router.use(authenticate);

router.post('/', authorize('department_head'), upload.single('file'), uploadCurriculum);
router.get('/', authorize('teacher', 'department_head', 'director'), listCurriculum);
router.get('/check', authorize('teacher'), checkCurriculum);
router.post('/extract-session', authorize('teacher'), upload.single('file'), extractSession);
router.get('/:id/text', authorize('teacher', 'department_head'), getCurriculumText);
router.delete('/:id', authorize('department_head'), deleteCurriculum);

module.exports = router;
