const { pool } = require('../config/db');

/** Internal helper used by other controllers to push a notification. */
async function notify(userId, lessonPlanId, message) {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, lesson_plan_id, message) VALUES (?, ?, ?)',
      [userId, lessonPlanId, message]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

async function listNotifications(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    return res.json({ notifications: rows });
  } catch (err) {
    console.error('List notifications error:', err);
    return res.status(500).json({ message: 'Could not fetch notifications.' });
  }
}

async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [
      id,
      req.user.id,
    ]);
    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ message: 'Could not update notification.' });
  }
}

module.exports = { notify, listNotifications, markNotificationRead };
