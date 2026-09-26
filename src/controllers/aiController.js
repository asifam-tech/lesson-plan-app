// const { generateLessonPlanDraft, AIServiceError } = require('../services/aiService');

// /**
//  * Teacher: generate a lesson plan draft from a short brief using AI.
//  * Returns { title, objective, content } -- the same shape the
//  * lesson plan form/POST /lesson-plans body uses -- so the frontend
//  * can drop it straight into the create-lesson form for the teacher
//  * to review and edit before saving.
//  *
//  * This endpoint does NOT save anything; it only drafts text. The
//  * teacher still saves/submits via the existing lesson-plan endpoints.
//  */
// async function generateLessonPlan(req, res) {
//   try {
//     const { subject, gradeLevel, topic, duration, notes } = req.body;
//     const draft = await generateLessonPlanDraft({ subject, gradeLevel, topic, duration, notes });
//     return res.json({ draft });
//   } catch (err) {
//     if (err instanceof AIServiceError) {
//       return res.status(err.status).json({ message: err.message });
//     }
//     console.error('Generate lesson plan (AI) error:', err);
//     return res.status(500).json({ message: 'Could not generate a lesson plan draft.' });
//   }
// }

// module.exports = { generateLessonPlan };
const { generateLessonPlanDraft, AIServiceError } = require('../services/aiService');
const { pool } = require('../config/db');

/**
 * Helper: get active curriculum text
 */
async function getActiveCurriculumText(subject, gradeLevel, department) {
  const [rows] = await pool.query(
    `SELECT extracted_text 
     FROM curriculum_documents
     WHERE subject = ? 
       AND grade_level = ? 
       AND department = ?
       AND is_active = TRUE
     ORDER BY created_at DESC
     LIMIT 1`,
    [subject, gradeLevel, department]
  );

  return rows.length ? rows[0].extracted_text : null;
}

async function generateLessonPlan(req, res) {
  try {
    const { subject, gradeLevel, topic, duration, notes } = req.body;

    const department = req.user?.department;

    // ✅ GET CURRICULUM TEXT
    const syllabus = await getActiveCurriculumText(
      subject,
      gradeLevel,
      department
    );

    const draft = await generateLessonPlanDraft({
      subject,
      gradeLevel,
      topic,
      duration,
      notes,
      syllabus
    });

    return res.json({ draft });

  } catch (err) {
    if (err instanceof AIServiceError) {
      return res.status(err.status).json({ message: err.message });
    }

    console.error('Generate lesson plan error:', err);
    return res.status(500).json({
      message: 'Could not generate lesson plan draft.'
    });
  }
}

module.exports = { generateLessonPlan };