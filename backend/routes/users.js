const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { runQuery, getOne, getAll } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

const reportUpload = multer({ 
  storage: reportStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed!'));
  }
});


router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getOne(
      'SELECT id, name, email, phone, address_line1, address_line2, gender, dob, profile_image FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});


router.put('/profile', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const { name, phone, address_line1, address_line2, gender, dob } = req.body;
    
    const user = await getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : user.profile_image;
    
    await runQuery(
      `UPDATE users 
       SET name = ?, phone = ?, address_line1 = ?, address_line2 = ?, 
           gender = ?, dob = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name || user.name, phone, address_line1, address_line2, gender, dob, profileImage, req.user.userId]
    );
    
    const updatedUser = await getOne(
      'SELECT id, name, email, phone, address_line1, address_line2, gender, dob, profile_image FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});


router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }
    
    const user = await getOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);
    
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.userId]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change password' 
    });
  }
});


router.post('/report', authenticateToken, reportUpload.single('media'), async (req, res) => {
  try {
    const { item_type, location, time_found, description } = req.body;
    
    if (!item_type || !location || !time_found || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    
    const mediaPath = req.file ? `/uploads/reports/${req.file.filename}` : null;
    
    
    const reportResult = await runQuery(
      'INSERT INTO reports (user_id, item_type, location, time_found, description, media) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, item_type, location, time_found, description, mediaPath]
    );
    
    
    await runQuery(
      `INSERT INTO items (name, speciality, image, degree, experience, about, address_line1, address_line2, status, reported_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?)`,
      [
        item_type, 
        'Others', 
        mediaPath || '/uploads/items/default.jpg', 
        'Found Item', 
        `Found at ${time_found}`, 
        description, 
        location,
        '', 
        req.user.userId 
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Report submitted and item added to catalog successfully!',
      reportId: reportResult.lastID
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit report' 
    });
  }
});


router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await getAll(
      'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    
    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reports' 
    });
  }
});

module.exports = router;