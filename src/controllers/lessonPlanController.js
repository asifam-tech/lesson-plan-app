const { pool } = require('../config/db');
const { notify } = require('./notificationController');

/**
 * Teacher: create a new lesson plan as a draft.
 * Accepts either typed content or an uploaded file (or both).
 */
async function createLessonPlan(req, res) {
  try {
    const { title, objective, content } = req.body;
    const teacherId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: 'title is required.' });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO lesson_plans (teacher_id, title, objective, content, file_url, department, status, current_stage)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', 'with_teacher')`,
      [teacherId, title, objective || null, content || null, fileUrl, req.user.department || null]
    );

    const [rows] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [result.insertId]);
    return res.status(201).json({ lessonPlan: rows[0] });
  } catch (err) {
    console.error('Create lesson plan error:', err);
    return res.status(500).json({ message: 'Could not create lesson plan.' });
  }
}

/**
 * Teacher: edit a draft (or a rejected plan) before/after submission.
 * Only the owning teacher can edit, and only while it's not actively
 * sitting with a reviewer.
 */
async function updateLessonPlan(req, res) {
  try {
    const { id } = req.params;
    const { title, objective, content } = req.body;

    const [rows] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }
    const plan = rows[0];

    if (plan.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own lesson plans.' });
    }

    if (!['with_teacher'].includes(plan.current_stage)) {
      return res.status(400).json({ message: 'This plan is currently under review and cannot be edited.' });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : plan.file_url;

    await pool.query(
      `UPDATE lesson_plans
       SET title = ?, objective = ?, content = ?, file_url = ?
       WHERE id = ?`,
      [title ?? plan.title, objective ?? plan.objective, content ?? plan.content, fileUrl, id]
    );

    const [updated] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    return res.json({ lessonPlan: updated[0] });
  } catch (err) {
    console.error('Update lesson plan error:', err);
    return res.status(500).json({ message: 'Could not update lesson plan.' });
  }
}

/**
 * Teacher: delete a draft. Plans already submitted cannot be deleted,
 * only drafts, to preserve the review audit trail.
 */
async function deleteLessonPlan(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }
    const plan = rows[0];

    if (plan.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own lesson plans.' });
    }

    if (plan.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft lesson plans can be deleted.' });
    }

    await pool.query('DELETE FROM lesson_plans WHERE id = ?', [id]);
    return res.json({ message: 'Lesson plan deleted.' });
  } catch (err) {
    console.error('Delete lesson plan error:', err);
    return res.status(500).json({ message: 'Could not delete lesson plan.' });
  }
}

/**
 * Teacher: submit a draft (or resubmit a rejected plan) for review.
 * Moves it to the department head's queue.
 */
async function submitLessonPlan(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }
    const plan = rows[0];

    if (plan.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only submit your own lesson plans.' });
    }

    if (!['draft', 'dept_rejected', 'director_rejected'].includes(plan.status)) {
      return res.status(400).json({ message: 'This lesson plan has already been submitted.' });
    }

    await pool.query(
      `UPDATE lesson_plans
       SET status = 'pending', current_stage = 'with_department_head', submitted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    const [updated] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    return res.json({ lessonPlan: updated[0] });
  } catch (err) {
    console.error('Submit lesson plan error:', err);
    return res.status(500).json({ message: 'Could not submit lesson plan.' });
  }
}

/**
 * Shared "list" endpoint, scoped by role:
 *  - teacher: only their own plans
 *  - department_head: plans from their department, with department_head's queue
 *  - director: plans that have cleared department head review
 * Supports optional ?status= filter for tab-style views
 * (Pending / Approved / Rejected).
 */
async function listLessonPlans(req, res) {
  try {
    const { role, id: userId, department } = req.user;
    const { status } = req.query;

    let query = 'SELECT lp.*, u.name AS teacher_name FROM lesson_plans lp JOIN users u ON lp.teacher_id = u.id WHERE ';
    const params = [];

    if (role === 'teacher') {
      query += 'lp.teacher_id = ?';
      params.push(userId);
    } else if (role === 'department_head') {
      query += 'lp.department = ? AND lp.status != "draft"';
      params.push(department);
    } else if (role === 'director') {
      query += '(lp.status IN ("dept_approved", "director_approved", "director_rejected"))';
    }

    if (status) {
      query += ' AND lp.status = ?';
      params.push(status);
    }

    query += ' ORDER BY lp.updated_at DESC';

    const [rows] = await pool.query(query, params);
    return res.json({ lessonPlans: rows });
  } catch (err) {
    console.error('List lesson plans error:', err);
    return res.status(500).json({ message: 'Could not fetch lesson plans.' });
  }
}

/**
 * Get a single lesson plan with its full review history.
 * Visibility: owning teacher, the department head of that department,
 * or any director (once it has reached director review or beyond).
 */
async function getLessonPlan(req, res) {
  try {
    const { id } = req.params;
    const { role, id: userId, department } = req.user;

    const [rows] = await pool.query(
      `SELECT lp.*, u.name AS teacher_name FROM lesson_plans lp
       JOIN users u ON lp.teacher_id = u.id WHERE lp.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }
    const plan = rows[0];

    const isOwner = role === 'teacher' && plan.teacher_id === userId;
    const isDeptHead = role === 'department_head' && plan.department === department;
    const isDirector = role === 'director';

    if (!isOwner && !isDeptHead && !isDirector) {
      return res.status(403).json({ message: 'You do not have access to this lesson plan.' });
    }

    const [reviews] = await pool.query(
      `SELECT r.*, u.name AS reviewer_name FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.lesson_plan_id = ? ORDER BY r.review_date ASC`,
      [id]
    );

    return res.json({ lessonPlan: plan, reviews });
  } catch (err) {
    console.error('Get lesson plan error:', err);
    return res.status(500).json({ message: 'Could not fetch lesson plan.' });
  }
}

/**
 * Department Head: approve or reject a plan in their queue.
 * Approve -> moves to director's queue.
 * Reject -> bounces back to the teacher.
 */
async function departmentReview(req, res) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'action must be "approved" or "rejected".' });
    }

    const [rows] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }
    const plan = rows[0];

    if (plan.department !== req.user.department) {
      return res.status(403).json({ message: 'This lesson plan is outside your department.' });
    }
    if (plan.current_stage !== 'with_department_head') {
      return res.status(400).json({ message: 'This lesson plan is not awaiting department head review.' });
    }

    const newStatus = action === 'approved' ? 'dept_approved' : 'dept_rejected';
    const newStage = action === 'approved' ? 'with_director' : 'with_teacher';

    await pool.query('UPDATE lesson_plans SET status = ?, current_stage = ? WHERE id = ?', [
      newStatus,
      newStage,
      id,
    ]);

    await pool.query(
      `INSERT INTO reviews (lesson_plan_id, reviewer_id, role, action, comment)
       VALUES (?, ?, 'department_head', ?, ?)`,
      [id, req.user.id, action, comment || null]
    );

    const message =
      action === 'approved'
        ? `Your lesson plan "${plan.title}" was approved by the department head and sent to the director.`
        : `Your lesson plan "${plan.title}" was rejected by the department head.`;
    await notify(plan.teacher_id, id, message);

    const [updated] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    return res.json({ lessonPlan: updated[0] });
  } catch (err) {
    console.error('Department review error:', err);
    return res.status(500).json({ message: 'Could not process the review.' });
  }
}

/**
 * Director: approve or reject a plan that already cleared the
 * department head. Approve -> final approval. Reject -> back to teacher.
 */
async function directorReview(req, res) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'action must be "approved" or "rejected".' });
    }

    const [rows] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lesson plan not found.' });
    }
    const plan = rows[0];

    if (plan.current_stage !== 'with_director') {
      return res.status(400).json({ message: 'This lesson plan is not awaiting director review.' });
    }

    const newStatus = action === 'approved' ? 'director_approved' : 'director_rejected';
    const newStage = action === 'approved' ? 'completed' : 'with_teacher';

    await pool.query('UPDATE lesson_plans SET status = ?, current_stage = ? WHERE id = ?', [
      newStatus,
      newStage,
      id,
    ]);

    await pool.query(
      `INSERT INTO reviews (lesson_plan_id, reviewer_id, role, action, comment)
       VALUES (?, ?, 'director', ?, ?)`,
      [id, req.user.id, action, comment || null]
    );

    const message =
      action === 'approved'
        ? `Your lesson plan "${plan.title}" received final approval from the director.`
        : `Your lesson plan "${plan.title}" was rejected by the director.`;
    await notify(plan.teacher_id, id, message);

    const [updated] = await pool.query('SELECT * FROM lesson_plans WHERE id = ?', [id]);
    return res.json({ lessonPlan: updated[0] });
  } catch (err) {
    console.error('Director review error:', err);
    return res.status(500).json({ message: 'Could not process the review.' });
  }
}

module.exports = {
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  submitLessonPlan,
  listLessonPlans,
  getLessonPlan,
  departmentReview,
  directorReview,
};
