const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listNotifications, markNotificationRead } = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', listNotifications);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
