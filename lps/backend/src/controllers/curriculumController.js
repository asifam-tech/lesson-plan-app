const fs = require('fs/promises');
const { pool } = require('../config/db');
const { extractTextFromFile } = require('../utils/extractText');

function normalise(value) {
  return String(value || '').trim();
}

function sanitiseRows(rows, includeExtractedText = false) {
  return rows.map((row) => {
    const hasText = !!row.extracted_text;
    const out = { ...row, has_text: hasText };
    if (!includeExtractedText) delete out.extracted_text;
    return out;
  });
}

async function uploadCurriculum(req, res) {
  try {
    const subject = normalise(req.body.subject);
    const gradeLevel = normalise(req.body.grade_level);
    const title = normalise(req.body.title);
    const department = req.user.department;

    if (!subject || !gradeLevel || !title) {
      return res.status(400).json({ message: 'title, subject, and grade_level are required.' });
    }
    if (!department) {
      return res.status(400).json({ message: 'Your account has no department assigned.' });
    }

    let extractedText = null;
    let fileUrl = null;

    if (req.file) {
      extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
      fileUrl = `/uploads/${req.file.filename}`;
    }

    await pool.query(
      `UPDATE curriculum_documents
       SET is_active = FALSE
       WHERE department = ? AND subject = ? AND grade_level = ?`,
      [department, subject, gradeLevel]
    );

    const [result] = await pool.query(
      `INSERT INTO curriculum_documents
       (department, subject, grade_level, title, file_url, extracted_text, is_active, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [department, subject, gradeLevel, title, fileUrl, extractedText, req.user.id]
    );

    const [rows] = await pool.query('SELECT * FROM curriculum_documents WHERE id = ?', [result.insertId]);
    return res.status(201).json({ curriculum: sanitiseRows(rows)[0] });
  } catch (err) {
    console.error('Upload curriculum error:', err);
    return res.status(500).json({ message: 'Could not upload curriculum document.' });
  }
}

async function listCurriculum(req, res) {
  try {
    const { role, department } = req.user;
    let rows = [];

    if (role === 'department_head') {
      [rows] = await pool.query(
        `SELECT * FROM curriculum_documents
         WHERE department = ?
         ORDER BY created_at DESC`,
        [department]
      );
    } else if (role === 'director') {
      [rows] = await pool.query(
        `SELECT * FROM curriculum_documents
         ORDER BY department ASC, subject ASC, created_at DESC`
      );
    } else if (role === 'teacher') {
      [rows] = await pool.query(
        `SELECT * FROM curriculum_documents
         WHERE department = ? AND is_active = TRUE
         ORDER BY subject ASC, grade_level ASC, created_at DESC`,
        [department]
      );
    }

    return res.json({ curricula: sanitiseRows(rows) });
  } catch (err) {
    console.error('List curriculum error:', err);
    return res.status(500).json({ message: 'Could not fetch curriculum documents.' });
  }
}

async function getCurriculumText(req, res) {
  try {
    const { id } = req.params;
    const { role, department } = req.user;

    const [rows] = await pool.query('SELECT * FROM curriculum_documents WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Curriculum document not found.' });
    }

    const row = rows[0];
    const canDepartmentHeadAccess = role === 'department_head' && row.department === department;
    const canTeacherAccess = role === 'teacher' && row.department === department && row.is_active;

    if (!canDepartmentHeadAccess && !canTeacherAccess) {
      return res.status(403).json({ message: 'You do not have access to this curriculum document.' });
    }

    if (!row.extracted_text) {
      return res.json({ extracted_text: null, warning: 'No text could be extracted from this document.' });
    }

    return res.json({ extracted_text: row.extracted_text });
  } catch (err) {
    console.error('Get curriculum text error:', err);
    return res.status(500).json({ message: 'Could not fetch curriculum text.' });
  }
}

async function deleteCurriculum(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM curriculum_documents WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Curriculum document not found.' });
    }

    const doc = rows[0];
    if (doc.department !== req.user.department) {
      return res.status(403).json({ message: 'You can only delete curriculum documents from your department.' });
    }

    await pool.query('DELETE FROM curriculum_documents WHERE id = ?', [id]);
    return res.json({ message: 'Curriculum document deleted.' });
  } catch (err) {
    console.error('Delete curriculum error:', err);
    return res.status(500).json({ message: 'Could not delete curriculum document.' });
  }
}

async function checkCurriculum(req, res) {
  try {
    const subject = normalise(req.query.subject);
    const gradeLevel = normalise(req.query.grade_level);
    const department = req.user.department;

    if (!subject || !gradeLevel) {
      return res.status(400).json({ message: 'subject and grade_level are required.' });
    }

    const [exactRows] = await pool.query(
      `SELECT id, title, subject, grade_level
       FROM curriculum_documents
       WHERE department = ? AND subject = ? AND grade_level = ? AND is_active = TRUE
       ORDER BY created_at DESC
       LIMIT 1`,
      [department, subject, gradeLevel]
    );

    if (exactRows.length > 0) {
      return res.json({ match: 'exact', curriculum: exactRows[0] });
    }

    const [partialRows] = await pool.query(
      `SELECT id, title, subject, grade_level, is_active, created_at
       FROM curriculum_documents
       WHERE department = ? AND subject = ? AND is_active = TRUE
       ORDER BY grade_level ASC, created_at DESC`,
      [department, subject]
    );

    if (partialRows.length > 0) {
      return res.json({ match: 'partial', curricula: partialRows });
    }

    return res.json({ match: 'none' });
  } catch (err) {
    console.error('Check curriculum error:', err);
    return res.status(500).json({ message: 'Could not check curriculum availability.' });
  }
}

async function extractSession(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'A PDF or DOCX file is required.' });
    }

    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

    try {
      await fs.unlink(req.file.path);
    } catch (unlinkErr) {
      console.warn('Could not delete session upload:', unlinkErr.message);
    }

    if (!extractedText) {
      return res.json({
        extracted_text: null,
        warning: 'Could not extract text from this file. You can still generate from general knowledge.',
      });
    }

    return res.json({ extracted_text: extractedText });
  } catch (err) {
    console.error('Extract session curriculum error:', err);
    return res.status(500).json({ message: 'Could not extract text from this document.' });
  }
}

module.exports = {
  uploadCurriculum,
  listCurriculum,
  getCurriculumText,
  deleteCurriculum,
  checkCurriculum,
  extractSession,
};
