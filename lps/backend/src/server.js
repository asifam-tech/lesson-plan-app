const app = require('./app');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function start() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Lesson Plan API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Backend startup failed:', err.message);
  process.exit(1);
});
