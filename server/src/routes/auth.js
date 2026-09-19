const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePreferences, authLimiter } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
