const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runQuery, getOne, getAll } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/items';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed!'));
  }
});

// Valid categories — must match frontend Doctors.jsx and Report.jsx exactly
const VALID_CATEGORIES = [
  'Mobile Phones',
  'Keys',
  'Notes & Books',
  'Lunches & Bottles',
  'Wearables',
  'Wallets & Bags',
  'Electronics',
  'Others'
];

// GET all items (optionally filtered by speciality)
router.get('/', async (req, res) => {
  try {
    const { speciality } = req.query;

    let query = 'SELECT * FROM items WHERE status = "available"';
    let params = [];

    if (speciality) {
      query += ' AND speciality = ?';
      params.push(speciality);
    }

    query += ' ORDER BY created_at DESC';

    const items = await getAll(query, params);

    res.json({ success: true, count: items.length, items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch items' });
  }
});

// GET single item
router.get('/:id', async (req, res) => {
  try {
    const item = await getOne('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
});

// POST create item (report a found item)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, speciality, address_line1, address_line2, about } = req.body;

    // Validate required fields
    if (!name || !speciality) {
      return res.status(400).json({
        success: false,
        message: 'Item name and category are required'
      });
    }

    // Validate category is one of the known values
    if (!VALID_CATEGORIES.includes(speciality)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    const imagePath = req.file ? `/uploads/items/${req.file.filename}` : null;

    const result = await runQuery(
      `INSERT INTO items (name, speciality, image, about, address_line1, address_line2, reported_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, speciality, imagePath, about, address_line1, address_line2, req.user.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Item reported successfully',
      itemId: result.lastID
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ success: false, message: 'Failed to create item' });
  }
});

// PUT update item
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, speciality, address_line1, address_line2, about, status } = req.body;

    const item = await getOne('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Validate category if provided
    if (speciality && !VALID_CATEGORIES.includes(speciality)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    const imagePath = req.file ? `/uploads/items/${req.file.filename}` : item.image;

    await runQuery(
      `UPDATE items
       SET name = ?, speciality = ?, image = ?, about = ?,
           address_line1 = ?, address_line2 = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name         || item.name,
        speciality   || item.speciality,
        imagePath,
        about        || item.about,
        address_line1 || item.address_line1,
        address_line2 || item.address_line2,
        status       || item.status,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

// DELETE item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await getOne('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await runQuery('DELETE FROM items WHERE id = ?', [req.params.id]);

    if (item.image) {
      const imagePath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
});

// GET items by speciality (alternative route)
router.get('/speciality/:speciality', async (req, res) => {
  try {
    const items = await getAll(
      'SELECT * FROM items WHERE speciality = ? AND status = "available" ORDER BY created_at DESC',
      [req.params.speciality]
    );
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    console.error('Get items by speciality error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch items' });
  }
});

module.exports = router;