/**
 * Seeds a small set of demo users (one per role) so the app is
 * usable immediately after migration.
 * Usage: npm run seed
 */
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const DEMO_PASSWORD = 'Password123!';

async function seed() {
  try {
    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

    const users = [
      { name: 'Alemu Bekele', email: 'teacher@example.com', role: 'teacher', department: 'Mathematics' },
      { name: 'Sara Tesfaye', email: 'depthead@example.com', role: 'department_head', department: 'Mathematics' },
      { name: 'Kebede Worku', email: 'director@example.com', role: 'director', department: null },
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (name, email, password, role, department)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [u.name, u.email, hashed, u.role, u.department]
      );
    }

    console.log('Seed complete. Demo accounts (all use the same password):');
    console.log(`  Password for all accounts: ${DEMO_PASSWORD}`);
    users.forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email}`));
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
