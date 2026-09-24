const mysql = require('mysql2/promise');
require('dotenv').config();

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());
}

function getDbConfig({ multipleStatements = false } = {}) {
  const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  let config;

  if (connectionUrl) {
    if (!/^mysql2?:\/\//i.test(connectionUrl)) {
      throw new Error(
        'DATABASE_URL/MYSQL_URL must be a MySQL URL (mysql://...). This backend uses mysql2 and cannot connect to a PostgreSQL/Supabase URL.'
      );
    }

    const normalized = connectionUrl.replace(/^mysql2:/i, 'mysql:');
    const parsed = new URL(normalized);
    config = {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    };
  } else {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter((name) => !process.env[name]);

    if (missing.length) {
      throw new Error(`Missing database environment variable(s): ${missing.join(', ')}`);
    }

    config = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  return {
    ...config,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    dateStrings: true,
    multipleStatements,
    ...(truthy(process.env.DB_SSL)
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  };
}

const pool = mysql.createPool(getDbConfig());

async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    console.log('MySQL connected successfully.');
  } finally {
    conn.release();
  }
}

module.exports = { pool, testConnection, getDbConfig };
