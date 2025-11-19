const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getOne } = require('../database');
const { sendOTPEmail, sendPasswordResetEmail } = require('../emailService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'unilost_secret_key_2025';

// In-memory OTP storage
const otpStore = new Map();
const passwordResetOtpStore = new Map();

// Email validation function
const isValidMUJEmail = (email) => {
  return email.toLowerCase().endsWith('@muj.manipal.edu');
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Admin Login (No OTP)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@muj.manipal.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }

    if (password !== adminPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }

    // Generate admin token with special flag
    const token = jwt.sign({ 
      userId: 0, 
      email: adminEmail, 
      isAdmin: true 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: 0,
        name: 'Admin',
        email: adminEmail,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Admin login failed' 
    });
  }
});

// Send OTP for registration
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    if (!isValidMUJEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only @muj.manipal.edu email addresses are allowed' 
      });
    }

    const existingUser = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please login instead.' 
      });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      name
    });

    await sendOTPEmail(email, otp);

    console.log(`📧 Registration OTP sent to ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      expiresIn: 600
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please try again.' 
    });
  }
});

router.post('/verify-otp-register', async (req, res) => {
  try {
    const { email, otp, password, phone } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and password are required' 
      });
    }

    const storedData = otpStore.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired or not found. Please request a new OTP.' 
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please try again.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const existingUser = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [storedData.name, email.toLowerCase(), hashedPassword, phone]
    );

    otpStore.delete(email.toLowerCase());

    const token = jwt.sign({ userId: result.lastID, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to UniLost.',
      token,
      user: {
        id: result.lastID,
        name: storedData.name,
        email: email.toLowerCase(),
        phone
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
});


router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    if (!isValidMUJEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only @muj.manipal.edu email addresses are allowed' 
      });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email address.' 
      });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    passwordResetOtpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      userId: user.id
    });

    await sendPasswordResetEmail(email, otp);

    console.log(`📧 Password reset OTP sent to ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email.',
      expiresIn: 600
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send password reset OTP. Please try again.' 
    });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and new password are required' 
      });
    }

    const storedData = passwordResetOtpStore.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired or not found. Please request a new OTP.' 
      });
    }

    if (Date.now() > storedData.expiresAt) {
      passwordResetOtpStore.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please try again.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, storedData.userId]
    );

    passwordResetOtpStore.delete(email.toLowerCase());

    res.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password. Please try again.' 
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    if (!isValidMUJEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only @muj.manipal.edu email addresses are allowed' 
      });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};


const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    req.user = user;
    next();
  });
};


router.get('/me', authenticateToken, async (req, res) => {
  try {
    
    if (req.user.isAdmin) {
      return res.json({
        success: true,
        user: {
          id: 0,
          name: 'Admin',
          email: req.user.email,
          isAdmin: true
        }
      });
    }

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
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user data' 
    });
  }
});

// Delete account
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const { confirmText } = req.body;

    if (confirmText !== 'DELETE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please type DELETE to confirm account deletion' 
      });
    }

    const userId = req.user.userId;

    await runQuery('DELETE FROM appointments WHERE user_id = ?', [userId]);
    await runQuery('DELETE FROM reports WHERE user_id = ?', [userId]);
    await runQuery('DELETE FROM items WHERE reported_by = ?', [userId]);
    await runQuery('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'Your account has been permanently deleted.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete account. Please try again.' 
    });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.authenticateAdmin = authenticateAdmin;