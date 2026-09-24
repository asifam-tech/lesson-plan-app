const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const curriculumRoutes = require('./routes/curriculumRoutes');
const lessonPlanRoutes = require('./routes/lessonPlanRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lesson-plan-app-two.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean); // ባዶ እሴቶችን ያስወግዳል

app.use(cors({
  origin: function (origin, callback) {
    //ሪኩዌስቱ ከሞባይል አፕ ወይም ከስልካችን ብሮውዘር ሲመጣ origin ላይኖረው ይችላል (CORSን ለማለፍ)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
 //app.use(cors({ 
//   origin: [
//     process.env.CLIENT_URL, 
//     'http://localhost:5173', 
//     'https://lesson-plan-app-two.vercel.app'
//   ],
//   credentials: true 
// }));

// app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

// Serve uploaded lesson plan files
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/lesson-plans', lessonPlanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Multer / generic error handler
app.use((err, req, res, next) => {
  if (err) {
    console.error(err);
    return res.status(err.status || 400).json({ message: err.message || 'Something went wrong.' });
  }
  next();
});

app.use((req, res) => {
   res.status(404).json({ message: 'Route not found.' });
 });

module.exports = app;
