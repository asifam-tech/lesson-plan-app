const { pool } = require('./db');

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows[0].count) > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return Number(rows[0].count) > 0;
}

async function runMigration() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS curriculum_documents (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        department     VARCHAR(100) NOT NULL,
        subject        VARCHAR(150) NOT NULL,
        grade_level    VARCHAR(100) NOT NULL,
        title          VARCHAR(255) NOT NULL,
        file_url       VARCHAR(500) DEFAULT NULL,
        extracted_text LONGTEXT     DEFAULT NULL,
        is_active      BOOLEAN NOT NULL DEFAULT TRUE,
        uploaded_by    INT NOT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_curriculum_uploader
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    if (!(await columnExists('lesson_plans', 'ai_assisted'))) {
      await connection.query('ALTER TABLE lesson_plans ADD COLUMN ai_assisted BOOLEAN DEFAULT FALSE');
    }
    if (!(await columnExists('lesson_plans', 'curriculum_doc_id'))) {
      await connection.query('ALTER TABLE lesson_plans ADD COLUMN curriculum_doc_id INT DEFAULT NULL');
    }
    if (!(await columnExists('lesson_plans', 'ai_context_type'))) {
      await connection.query('ALTER TABLE lesson_plans ADD COLUMN ai_context_type VARCHAR(50) DEFAULT NULL');
    }

    if (!(await indexExists('curriculum_documents', 'idx_curriculum_department'))) {
      await connection.query('CREATE INDEX idx_curriculum_department ON curriculum_documents(department)');
    }
    if (!(await indexExists('curriculum_documents', 'idx_curriculum_lookup'))) {
      await connection.query('CREATE INDEX idx_curriculum_lookup ON curriculum_documents(department, subject, grade_level, is_active)');
    }

    await connection.commit();
    console.log('Curriculum migration complete.');
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigration();
