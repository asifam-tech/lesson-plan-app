// const bcrypt = require('bcryptjs');
// const { pool } = require('../config/db');
// const { signToken } = require('../utils/jwt');
// //  const jwtUtils = require('../utils/jwt');

// //console.log('jwtUtils =', jwtUtils);
// const VALID_ROLES = ['teacher', 'department_head', 'director'];

//  async function register(req, res) {
//   try {
//     const { name, email, password, role, department } = req.body;

//     if (!name || !email || !password || !role) {
//       return res.status(400).json({ message: 'name, email, password, and role are required.' });
//     }

//     if (!VALID_ROLES.includes(role)) {
//       return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
//     }

//     const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
//     if (existing.length > 0) {
//       return res.status(409).json({ message: 'An account with this email already exists.' });
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     const [result] = await pool.query(
//       'INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
//       [name, email, hashed, role, department || null]
//     );

//     const user = { id: result.insertId, name, email, role, department: department || null };
//     const token = signToken({ id: user.id, role: user.role, department: user.department });

//     return res.status(201).json({ user, token });
//   } catch (err) {
//     console.error('Register error:', err);
//     return res.status(500).json({ message: 'Something went wrong while registering.' });
//   }
// }

// async function login(req, res) {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: 'email and password are required.' });
//     }

//     const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
//     if (rows.length === 0) {
//       return res.status(401).json({ message: 'Invalid email or password.' });
//     }

//     const userRow = rows[0];
//     const match = await bcrypt.compare(password, userRow.password);
//     if (!match) {
//       return res.status(401).json({ message: 'Invalid email or password.' });
//     }

//     const user = {
//       id: userRow.id,
//       name: userRow.name,
//       email: userRow.email,
//       role: userRow.role,
//       department: userRow.department,
//     };
//     const token = signToken({ id: user.id, role: user.role, department: user.department });

//     return res.json({ user, token });
//   } catch (err) {
//     console.error('Login error:', err);
//     return res.status(500).json({ message: 'Something went wrong while logging in.' });
//   }
// }

// async function me(req, res) {
//   try {
//     const [rows] = await pool.query(
//       'SELECT id, name, email, role, department, created_at FROM users WHERE id = ?',
//       [req.user.id]
//     );
//     if (rows.length === 0) {
//       return res.status(404).json({ message: 'User not found.' });
//     }
//     return res.json({ user: rows[0] });
//   } catch (err) {
//     console.error('Me error:', err);
//     return res.status(500).json({ message: 'Something went wrong.' });
//   }
// }

// module.exports = { register, login, me };
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { signToken } = require('../utils/jwt');

const VALID_ROLES = ['teacher', 'department_head', 'director'];

async function register(req, res) {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, and role are required.' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')} `});
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, department || null]
    );

    const user = { id: result.insertId, name, email, role, department: department || null };
    const token = signToken({ id: user.id, role: user.role, department: user.department });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Something went wrong while registering.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userRow = rows[0];
    const match = await bcrypt.compare(password, userRow.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      department: userRow.department,
    };
    const token = signToken({ id: user.id, role: user.role, department: user.department });

    return res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
}

async function me(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, department, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
}

module.exports = { register, login, me };
