const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, uploadMedia, uploadMultipleMedia, getMediaGallery, deleteMedia } = require('../controllers/mediaController');

// All routes require authentication
router.use(protect);

// Get media gallery
router.get('/', getMediaGallery);

// Upload single file
router.post('/upload', upload.single('file'), uploadMedia);

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), uploadMultipleMedia);

// Delete media
router.post('/delete', deleteMedia);
router.delete('/:id', (req, res, next) => {
  req.body.id = req.params.id;
  deleteMedia(req, res, next);
});

module.exports = router;
