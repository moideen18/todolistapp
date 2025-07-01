const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');

// Update the verify route to use params instead of query
router.get('/verify/:token', verifyEmail);  // Changed this line
router.post('/login', login);
router.post('/signup', signup);
router.post('/resend-verification', resendVerification);

module.exports = router;
