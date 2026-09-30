const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSummary } = require('../controllers/reportController');

router.get('/summary', authenticate, authorize('department_head', 'director'), getSummary);

module.exports = router;
