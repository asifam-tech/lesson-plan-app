 const app = require('./app');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await testConnection();
  } catch (err) {
    console.warn('Starting server without a verified DB connection. Check your .env settings.');
  }

  app.listen(PORT, () => {
    console.log(`Lesson Plan API running on http://localhost:${PORT}`);
  });
}

start();
