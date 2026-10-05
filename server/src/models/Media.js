const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'raw'],
      default: 'image',
      index: true,
    },
    format: {
      type: String,
    },
    bytes: {
      type: Number,
      default: 0,
    },
    originalName: {
      type: String,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    clientName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

mediaSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
