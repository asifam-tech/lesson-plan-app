/**
 * Creates/updates tables in the MySQL database configured by Render env vars.
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('./db');
require('dotenv').config();

async function migrate() {
  const sqlPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const connection = await mysql.createConnection(getDbConfig({ multipleStatements: true }));

  try {
    console.log('Running schema migration in configured database...');
    await connection.query(sql);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

migrate();
