const mongoose = require('mongoose');

// ─── Single message within a conversation ──────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['me', 'them'],
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    // 'text', 'image', 'video', 'file', 'link', 'audio'
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'file', 'link', 'audio'],
      default: 'text',
    },
    // For media messages – Cloudinary URL or external link
    mediaUrl: {
      type: String,
      trim: true,
    },
    // Original filename for file/media
    mediaName: {
      type: String,
      trim: true,
    },
    // Cloudinary public_id (for deletion)
    cloudinaryId: {
      type: String,
      trim: true,
    },
    // Timestamp of the original message (from Messenger)
    messageDate: {
      type: Date,
      default: Date.now,
    },
    // Was this message edited?
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    // Reactions / emoji (optional, like Messenger)
    reaction: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── AI Insights Schema ────────────────────────────────────────────────────────
const aiInsightsSchema = new mongoose.Schema(
  {
    summary: { type: String, trim: true },
    pricesDiscussed: [
      {
        amount: { type: Number },
        currency: { type: String, default: 'GBP' },
        context: { type: String, trim: true },
      },
    ],
    finalPrice: {
      amount: { type: Number },
      currency: { type: String, default: 'GBP' },
      context: { type: String, trim: true },
    },
    keyTopics: [{ type: String, trim: true }],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed'],
    },
    actionItems: [{ type: String, trim: true }],
    clientInterestLevel: {
      type: String,
      enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
    },
    analyzedAt: { type: Date },
  },
  { _id: false }
);

// ─── Main Conversation Schema ──────────────────────────────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    // Owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Link to client
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    // All messages
    messages: [messageSchema],
    // AI-generated insights
    aiInsights: {
      type: aiInsightsSchema,
      default: () => ({}),
    },
    // Total message count (denormalized for performance)
    messageCount: {
      type: Number,
      default: 0,
    },
    // Last message date (for sorting)
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
conversationSchema.index({ userId: 1, clientId: 1 }, { unique: true });
conversationSchema.index({ userId: 1, lastMessageAt: -1 });

// ─── Pre-save: update denormalized fields ──────────────────────────────────────
conversationSchema.pre('save', function (next) {
  this.messageCount = this.messages.length;
  if (this.messages.length > 0) {
    const dates = this.messages.map((m) => m.messageDate || m.createdAt);
    this.lastMessageAt = new Date(Math.max(...dates.map((d) => new Date(d))));
  }
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
