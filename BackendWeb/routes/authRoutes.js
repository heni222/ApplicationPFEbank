const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  getProfile
} = require('../controller/authController');
const { protect } = require('../middelwares/auth');


router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/login', login);

// Routes protégées
router.get('/profile', protect, getProfile);

module.exports = router;