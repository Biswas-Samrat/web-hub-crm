const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getToday, getOverdue, getUpcoming } = require('../controllers/followupController');

router.use(protect);

router.get('/today', getToday);
router.get('/overdue', getOverdue);
router.get('/upcoming', getUpcoming);

module.exports = router;
