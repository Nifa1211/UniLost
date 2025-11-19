const express = require('express');
const { runQuery, getOne, getAll } = require('../database');
const { authenticateAdmin } = require('./auth');

const router = express.Router();

// Get all pending reports
router.get('/reports/pending', authenticateAdmin, async (req, res) => {
  try {
    const reports = await getAll(
      `SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email
      FROM reports r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC`
    );
    
    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending reports' 
    });
  }
});

// Get all reports 
router.get('/reports/all', authenticateAdmin, async (req, res) => {
  try {
    const reports = await getAll(
      `SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email
      FROM reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC`
    );
    
    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reports' 
    });
  }
});

// Approve report 
router.post('/reports/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const reportId = req.params.id;
    
    const report = await getOne('SELECT * FROM reports WHERE id = ?', [reportId]);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    if (report.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Report already approved' 
      });
    }

    // Update report status
    await runQuery(
      'UPDATE reports SET status = "approved" WHERE id = ?',
      [reportId]
    );

    // Create item from report
    await runQuery(
      `INSERT INTO items (name, speciality, image, degree, experience, about, address_line1, address_line2, status, reported_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?)`,
      [
        report.item_type,
        report.item_type, 
        report.media || '/uploads/items/default.jpg',
        'Found Item',
        `Found at ${report.time_found}`,
        report.description,
        report.location,
        '',
        report.user_id
      ]
    );

    res.json({
      success: true,
      message: 'Report approved and item added to catalog'
    });
  } catch (error) {
    console.error('Approve report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve report' 
    });
  }
});

// Reject report
router.post('/reports/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const reportId = req.params.id;
    
    const report = await getOne('SELECT * FROM reports WHERE id = ?', [reportId]);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    await runQuery(
      'UPDATE reports SET status = "rejected" WHERE id = ?',
      [reportId]
    );

    res.json({
      success: true,
      message: 'Report rejected'
    });
  } catch (error) {
    console.error('Reject report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject report' 
    });
  }
});

// Delete report
router.delete('/reports/:id', authenticateAdmin, async (req, res) => {
  try {
    const reportId = req.params.id;
    
    const report = await getOne('SELECT * FROM reports WHERE id = ?', [reportId]);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    await runQuery('DELETE FROM reports WHERE id = ?', [reportId]);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete report' 
    });
  }
});


router.get('/items', authenticateAdmin, async (req, res) => {
  try {
    const items = await getAll(
      `SELECT 
        i.*,
        u.name as reported_by_name,
        u.email as reported_by_email
      FROM items i
      LEFT JOIN users u ON i.reported_by = u.id
      ORDER BY i.created_at DESC`
    );
    
    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch items' 
    });
  }
});


router.delete('/items/:id', authenticateAdmin, async (req, res) => {
  try {
    const itemId = req.params.id;
    
    const item = await getOne('SELECT * FROM items WHERE id = ?', [itemId]);
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }

    
    await runQuery('DELETE FROM appointments WHERE item_id = ?', [itemId]);
    
    
    await runQuery('DELETE FROM items WHERE id = ?', [itemId]);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete item' 
    });
  }
});


router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {
      totalItems: 0,
      totalReports: 0,
      pendingReports: 0,
      approvedReports: 0,
      totalAppointments: 0,
      totalUsers: 0
    };

    const itemsCount = await getOne('SELECT COUNT(*) as count FROM items');
    stats.totalItems = itemsCount.count;

    const reportsCount = await getOne('SELECT COUNT(*) as count FROM reports');
    stats.totalReports = reportsCount.count;

    const pendingCount = await getOne('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');
    stats.pendingReports = pendingCount.count;

    const approvedCount = await getOne('SELECT COUNT(*) as count FROM reports WHERE status = "approved"');
    stats.approvedReports = approvedCount.count;

    const appointmentsCount = await getOne('SELECT COUNT(*) as count FROM appointments');
    stats.totalAppointments = appointmentsCount.count;

    const usersCount = await getOne('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = usersCount.count;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
});

module.exports = router;