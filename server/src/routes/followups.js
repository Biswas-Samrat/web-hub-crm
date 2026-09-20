const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFollowUpQueue, getToday, getOverdue, getUpcoming } = require('../controllers/followupController');

router.use(protect);

router.get('/', getFollowUpQueue);
router.get('/queue', getFollowUpQueue);
router.get('/today', getToday);
router.get('/overdue', getOverdue);
router.get('/upcoming', getUpcoming);

module.exports = router;

