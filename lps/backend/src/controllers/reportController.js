const { pool } = require('../config/db');

/**
 * Returns counts by status, scoped to the requester's department
 * (department head) or system-wide (director).
 */
async function getSummary(req, res) {
  try {
    const { role, department } = req.user;

    let where = '1=1';
    const params = [];
    if (role === 'department_head') {
      where = 'department = ?';
      params.push(department);
    }

    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM lesson_plans WHERE ${where} GROUP BY status`,
      params
    );

    const [byTeacher] = await pool.query(
      `SELECT u.name AS teacher_name, COUNT(*) AS count
       FROM lesson_plans lp JOIN users u ON lp.teacher_id = u.id
       WHERE ${where} GROUP BY lp.teacher_id ORDER BY count DESC`,
      params
    );

    return res.json({ statusBreakdown: rows, byTeacher });
  } catch (err) {
    console.error('Report summary error:', err);
    return res.status(500).json({ message: 'Could not generate report.' });
  }
}

module.exports = { getSummary };
