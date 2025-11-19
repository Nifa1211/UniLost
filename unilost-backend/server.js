const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const appointmentRoutes = require('./routes/appointments');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploads folder publicly
// (ensures images from /uploads/profiles and /uploads/reports load in browser)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Optional: handle non-existing upload subfolders gracefully
// This ensures `uploads/profiles` and `uploads/reports` exist before file operations.
const fs = require('fs');
const uploadDirs = ['uploads', 'uploads/profiles', 'uploads/reports'];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'UniLost API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize DB and start server
db.initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 UniLost Backend Server running on port ${PORT}`);
      console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
      console.log(`👤 Admin: ${process.env.ADMIN_EMAIL || 'admin@muj.manipal.edu'}`);
      console.log(`📂 Serving uploads from: ${path.join(__dirname, 'uploads')}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
