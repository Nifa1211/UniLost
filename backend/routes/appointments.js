const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runQuery, getOne, getAll } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/proofs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
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


router.post('/', authenticateToken, upload.single('proofFile'), async (req, res) => {
  try {
    const { item_id, appointment_date, appointment_time, item_type, location, time_lost } = req.body;
    
    if (!item_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item ID, date, and time are required' 
      });
    }
    

    const item = await getOne('SELECT * FROM items WHERE id = ? AND status = "available"', [item_id]);
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found or not available' 
      });
    }
    
    const proofFilePath = req.file ? `/uploads/proofs/${req.file.filename}` : null;
    
    const result = await runQuery(
      `INSERT INTO appointments (user_id, item_id, appointment_date, appointment_time, item_type, location, time_lost, proof_file)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, item_id, appointment_date, appointment_time, item_type, location, time_lost, proofFilePath]
    );
    
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointmentId: result.lastID
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to book appointment' 
    });
  }
});


router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await getAll(
      `SELECT 
        a.*,
        i.name as item_name,
        i.image as item_image,
        i.speciality,
        i.address_line1,
        i.address_line2
      FROM appointments a
      JOIN items i ON a.item_id = i.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC`,
      [req.user.userId]
    );
    
    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointments' 
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await getOne(
      `SELECT 
        a.*,
        i.name as item_name,
        i.image as item_image,
        i.speciality,
        i.address_line1,
        i.address_line2,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM appointments a
      JOIN items i ON a.item_id = i.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?`,
      [req.params.id]
    );
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointment' 
    });
  }
});


router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }
    
    const appointment = await getOne('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    await runQuery(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );
    
  
    if (status === 'completed') {
      await runQuery(
        'UPDATE items SET status = "claimed" WHERE id = ?',
        [appointment.item_id]
      );
    }
    
    res.json({
      success: true,
      message: 'Appointment status updated successfully'
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update appointment status' 
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await getOne(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found or unauthorized' 
      });
    }
    
    await runQuery(
      'UPDATE appointments SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel appointment' 
    });
  }
});

router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const appointments = await getAll(
      `SELECT 
        a.*,
        i.name as item_name,
        i.image as item_image,
        i.speciality,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM appointments a
      JOIN items i ON a.item_id = i.id
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC`
    );
    
    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointments' 
    });
  }
});

module.exports = router;
