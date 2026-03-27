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

router.get('/me', protect, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;