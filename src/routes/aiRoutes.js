const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { generateLessonPlan } = require('../controllers/aiController');

router.use(authenticate);

// Teachers draft lesson plans with AI before saving/submitting them
// through the existing /lesson-plans endpoints.
router.post('/generate-lesson-plan', authorize('teacher'), generateLessonPlan);

module.exports = router;
// const express = require('express');
// const router = express.Router();
// const { authenticate, authorize } = require('../middleware/auth');
// const { suggestSection, generateLesson, reviewLesson } = require('../controllers/aiController');

// router.use(authenticate);
// router.use(authorize('teacher'));

// router.post('/suggest', suggestSection);
// router.post('/generate-lesson', generateLesson);
// router.post('/review', reviewLesson);

// module.exports = router;
