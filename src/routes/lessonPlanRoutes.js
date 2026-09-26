const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  submitLessonPlan,
  listLessonPlans,
  getLessonPlan,
  departmentReview,
  directorReview,
} = require('../controllers/lessonPlanController');

router.use(authenticate);

// Teacher actions
router.post('/', authorize('teacher'), upload.single('file'), createLessonPlan);
router.put('/:id', authorize('teacher'), upload.single('file'), updateLessonPlan);
router.delete('/:id', authorize('teacher'), deleteLessonPlan);
router.post('/:id/submit', authorize('teacher'), submitLessonPlan);

// Shared read access (scoped by role inside the controller)
router.get('/', listLessonPlans);
router.get('/:id', getLessonPlan);

// Reviewer actions
router.post('/:id/department-review', authorize('department_head'), departmentReview);
router.post('/:id/director-review', authorize('director'), directorReview);

module.exports = router;
