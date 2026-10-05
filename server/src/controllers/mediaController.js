const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const Media = require('../models/Media');
const Conversation = require('../models/Conversation');
const { AppError } = require('../middleware/errorHandler');

// ─── Multer config for memory storage ──────────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/mkv',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/m4a',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
  ];

  if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not supported`, 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

// ─── Upload single file to Cloudinary & Save to DB ─────────────────────────────
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const file = req.file;

    // Determine resource type
    let resourceType = 'auto';
    let detectedType = 'document';
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
      detectedType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
      detectedType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary treats audio under video
      detectedType = 'audio';
    } else {
      resourceType = 'raw';
      detectedType = 'document';
    }

    const folder = `webhub-crm/${req.user._id}/media`;

    // Upload to Cloudinary using streams
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          ...(resourceType === 'image' && {
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    // Save to Media database collection
    const mediaDoc = await Media.create({
      userId: req.user._id,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: detectedType,
      format: result.format || file.originalname.split('.').pop(),
      bytes: result.bytes || file.size,
      originalName: file.originalname,
      clientId: req.body.clientId || undefined,
      clientName: req.body.clientName || undefined,
    });

    res.json({
      success: true,
      media: {
        _id: mediaDoc._id,
        url: mediaDoc.url,
        publicId: mediaDoc.publicId,
        resourceType: mediaDoc.resourceType,
        format: mediaDoc.format,
        bytes: mediaDoc.bytes,
        originalName: mediaDoc.originalName,
        createdAt: mediaDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(new AppError('Failed to upload file to cloud storage: ' + error.message, 500));
  }
};

// ─── Upload multiple files to Cloudinary ───────────────────────────────────────
const uploadMultipleMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }

    const folder = `webhub-crm/${req.user._id}/media`;
    const results = [];

    for (const file of req.files) {
      let resourceType = 'auto';
      let detectedType = 'document';
      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
        detectedType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
        detectedType = 'video';
      } else if (file.mimetype.startsWith('audio/')) {
        resourceType = 'video';
        detectedType = 'audio';
      } else {
        resourceType = 'raw';
        detectedType = 'document';
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      const mediaDoc = await Media.create({
        userId: req.user._id,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: detectedType,
        format: result.format || file.originalname.split('.').pop(),
        bytes: result.bytes || file.size,
        originalName: file.originalname,
      });

      results.push({
        _id: mediaDoc._id,
        url: mediaDoc.url,
        publicId: mediaDoc.publicId,
        resourceType: mediaDoc.resourceType,
        format: mediaDoc.format,
        bytes: mediaDoc.bytes,
        originalName: mediaDoc.originalName,
        createdAt: mediaDoc.createdAt,
      });
    }

    res.json({
      success: true,
      media: results,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(new AppError('Failed to upload files to cloud storage', 500));
  }
};

// ─── Get All Media for User (Gallery) ─────────────────────────────────────────
const getMediaGallery = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 50 } = req.query;

    const filter = { userId: req.user._id };

    if (type && type !== 'all') {
      filter.resourceType = type;
    }

    if (search) {
      filter.originalName = { $regex: search, $options: 'i' };
    }

    const total = await Media.countDocuments(filter);
    const media = await Media.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Also calculate storage stats
    const allUserMedia = await Media.find({ userId: req.user._id }, 'bytes resourceType');
    const totalBytes = allUserMedia.reduce((acc, curr) => acc + (curr.bytes || 0), 0);
    const countByType = {
      image: allUserMedia.filter(m => m.resourceType === 'image').length,
      video: allUserMedia.filter(m => m.resourceType === 'video').length,
      audio: allUserMedia.filter(m => m.resourceType === 'audio').length,
      document: allUserMedia.filter(m => m.resourceType === 'document' || m.resourceType === 'raw').length,
    };

    res.json({
      success: true,
      media,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalFiles: allUserMedia.length,
        totalBytes,
        totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
        countByType,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete media from Cloudinary & DB ─────────────────────────────────────────
const deleteMedia = async (req, res, next) => {
  try {
    const { publicId, id } = req.body;

    if (!publicId && !id) {
      return next(new AppError('Public ID or Media ID is required', 400));
    }

    let targetPublicId = publicId;

    if (id) {
      const mediaItem = await Media.findOne({ _id: id, userId: req.user._id });
      if (mediaItem) {
        targetPublicId = mediaItem.publicId;
        await Media.findByIdAndDelete(id);
      }
    } else if (publicId) {
      await Media.findOneAndDelete({ publicId, userId: req.user._id });
    }

    // Try deleting from Cloudinary across resource types
    if (targetPublicId) {
      try {
        await cloudinary.uploader.destroy(targetPublicId, { resource_type: 'image' });
      } catch {}
      try {
        await cloudinary.uploader.destroy(targetPublicId, { resource_type: 'video' });
      } catch {}
      try {
        await cloudinary.uploader.destroy(targetPublicId, { resource_type: 'raw' });
      } catch {}
    }

    res.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    next(new AppError('Failed to delete media', 500));
  }
};

module.exports = {
  upload,
  uploadMedia,
  uploadMultipleMedia,
  getMediaGallery,
  deleteMedia,
};
