const mongoose = require('mongoose');

// ─── Enums ─────────────────────────────────────────────────────────────────────
const CLIENT_STATUSES = [
  'New Lead',
  'Proposal Sent',
  'Awaiting Reply',
  'No Response',
  'Positive Reply',
  'Interested',
  'Follow Up Later',
  'Vacation',
  'Busy',
  'Contact Me Later',
  'Interested in a Few Weeks',
  'Interested in a Few Months',
  'Interested Next Year',
  'Demo Requested',
  'Demo In Progress',
  'Demo Sent',
  'Demo Liked',
  'Negotiating',
  'Ready to Start',
  'Ongoing Project',
  'Website Delivered',
  'Project Completed',
  'Not Interested',
  'Lost',
  'Do Not Contact',
];

const RESPONSE_TYPES = [
  'Interested',
  'Maybe Later',
  'Busy',
  'Vacation',
  'Contact Later',
  'Wants Demo',
  'Likes Demo',
  'Asked About Price',
  'Asked About Features',
  'Asked for More Information',
  'Ready to Start',
  'Not Interested',
  'No Response',
  'Other',
];

const DEMO_STATUSES = [
  'Not Requested',
  'Requested',
  'In Progress',
  'Ready',
  'Sent',
  'Viewed',
  'Liked',
  'Revision Requested',
  'Rejected',
];

const PROJECT_STATUSES = [
  'Not Started',
  'Planning',
  'In Development',
  'Waiting for Client',
  'Revision',
  'Ready for Delivery',
  'Delivered',
  'Completed',
  'Cancelled',
];

const PAYMENT_STATUSES = [
  'Not Discussed',
  'Pending',
  'Deposit Paid',
  'Partially Paid',
  'Paid',
  'Overdue',
];

const ACTIVITY_TYPES = [
  'Proposal Sent',
  'Client Replied',
  'Follow-Up Scheduled',
  'Follow-Up Completed',
  'Demo Created',
  'Demo Sent',
  'Demo Feedback',
  'Price Discussed',
  'Negotiation',
  'Project Started',
  'Website Delivered',
  'Payment Received',
  'Status Changed',
  'Note Added',
  'Client Created',
  'Client Converted',
  'Other',
];

// ─── Activity Log Schema ───────────────────────────────────────────────────────
const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ─── Demo Schema ───────────────────────────────────────────────────────────────
const demoSchema = new mongoose.Schema({
  requested: { type: Boolean, default: false },
  url: { type: String, trim: true },
  name: { type: String, trim: true },
  status: {
    type: String,
    enum: DEMO_STATUSES,
    default: 'Not Requested',
  },
  feedback: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdAt: { type: Date },
  sentAt: { type: Date },
});

// ─── Project Schema ────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: PROJECT_STATUSES,
    default: 'Not Started',
  },
  name: { type: String, trim: true },
  price: { type: Number, min: 0 },
  currency: { type: String, default: 'GBP', trim: true },
  startDate: { type: Date },
  targetDate: { type: Date },
  deliveryDate: { type: Date },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'Not Discussed',
  },
  liveUrl: { type: String, trim: true },
  notes: { type: String, trim: true },
  clientFeedback: { type: String, trim: true },
});

// ─── Main Client Schema ────────────────────────────────────────────────────────
const clientSchema = new mongoose.Schema(
  {
    // Owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Contact Info
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    contactName: { type: String, trim: true, maxlength: 100 },
    facebookUrl: {
      type: String,
      required: [true, 'Facebook URL is required'],
      trim: true,
    },
    facebookUrlNormalized: {
      type: String,
      trim: true,
      lowercase: true,
    },
    messengerUrl: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    country: { type: String, trim: true, index: true },
    city: { type: String, trim: true },
    category: { type: String, trim: true, index: true },

    // CRM
    status: {
      type: String,
      enum: CLIENT_STATUSES,
      default: 'New Lead',
      index: true,
    },
    responseType: {
      type: String,
      enum: RESPONSE_TYPES,
    },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true, maxlength: 10000 },
    interestLevel: {
      type: String,
      enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
    },

    // Dates
    proposalSentAt: { type: Date },
    firstContactAt: { type: Date },
    lastContactAt: { type: Date },
    followUpAt: { type: Date, index: true },
    followUpCompletedAt: { type: Date },

    // Demo
    demo: { type: demoSchema, default: () => ({}) },

    // Project
    project: { type: projectSchema, default: () => ({}) },

    // Activity
    activityLog: [activityLogSchema],

    // Archive / Soft Delete
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
clientSchema.index({ userId: 1, status: 1 });
clientSchema.index({ userId: 1, followUpAt: 1 });
clientSchema.index({ userId: 1, 'project.status': 1 });
clientSchema.index({ userId: 1, createdAt: -1 });
clientSchema.index({ userId: 1, facebookUrlNormalized: 1 });
clientSchema.index({
  businessName: 'text',
  contactName: 'text',
  facebookUrl: 'text',
  category: 'text',
  country: 'text',
  tags: 'text',
});

// ─── Pre-save: normalize Facebook URL ─────────────────────────────────────────
clientSchema.pre('save', function (next) {
  if (this.isModified('facebookUrl')) {
    this.facebookUrlNormalized = normalizeFacebookUrl(this.facebookUrl);
  }
  next();
});

function normalizeFacebookUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let str = url.trim();
  if (!str) return '';

  // Ensure protocol for URL parser
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }

  try {
    const parsed = new URL(str);
    let hostname = parsed.hostname.toLowerCase();

    // Standardize facebook domains
    if (
      hostname === 'facebook.com' ||
      hostname.endsWith('.facebook.com') ||
      hostname === 'fb.com' ||
      hostname.endsWith('.fb.com') ||
      hostname === 'fb.me' ||
      hostname.endsWith('.fb.me')
    ) {
      hostname = 'www.facebook.com';
    }

    let pathname = parsed.pathname.toLowerCase().replace(/\/+$/, '');
    if (!pathname) pathname = '';

    // If it's a numeric ID profile URL: profile.php?id=...
    if (pathname === '/profile.php' || pathname.endsWith('/profile.php')) {
      const id = parsed.searchParams.get('id');
      if (id) {
        return `https://${hostname}/profile.php?id=${id.trim().toLowerCase()}`;
      }
      return `https://${hostname}/profile.php`;
    }

    // If URL has specific identity query params (id or page_id)
    if (parsed.searchParams.has('id')) {
      const id = parsed.searchParams.get('id');
      return `https://${hostname}${pathname}?id=${id.trim().toLowerCase()}`;
    }
    if (parsed.searchParams.has('page_id')) {
      const pageId = parsed.searchParams.get('page_id');
      return `https://${hostname}${pathname}?page_id=${pageId.trim().toLowerCase()}`;
    }

    // For vanity URLs / pages / people paths (strip tracking params like fbclid, mibextid, ref, etc.)
    return `https://${hostname}${pathname}`;
  } catch {
    let normalized = str.toLowerCase().trim();
    normalized = normalized.replace(/\/+$/, '');
    const match = normalized.match(/profile\.php\?id=([0-9a-zA-Z._-]+)/i);
    if (match) {
      return `https://www.facebook.com/profile.php?id=${match[1]}`;
    }
    normalized = normalized.split('?')[0].split('#')[0];
    normalized = normalized.replace(/^https?:\/\/(www\.)?/, 'https://www.');
    return normalized;
  }
}

// ─── Static method: normalize URL ─────────────────────────────────────────────
clientSchema.statics.normalizeFacebookUrl = normalizeFacebookUrl;

// ─── Static method: repair existing records ──────────────────────────────────
clientSchema.statics.repairNormalizedUrls = async function () {
  try {
    const clients = await this.find({ facebookUrl: { $exists: true, $ne: '' } });
    let fixed = 0;
    for (const client of clients) {
      const correctNormalized = normalizeFacebookUrl(client.facebookUrl);
      if (client.facebookUrlNormalized !== correctNormalized) {
        await this.updateOne(
          { _id: client._id },
          { $set: { facebookUrlNormalized: correctNormalized } }
        );
        fixed++;
      }
    }
    if (fixed > 0) {
      console.log(`🔧 Repaired ${fixed} client Facebook normalized URLs in database.`);
    }
  } catch (err) {
    console.error('Error repairing Facebook normalized URLs:', err.message);
  }
};

// ─── Instance method: add activity ─────────────────────────────────────────────
clientSchema.methods.addActivity = function (type, message, metadata = {}) {
  this.activityLog.push({ type, message, metadata });
};

// ─── Export ────────────────────────────────────────────────────────────────────
const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
module.exports.CLIENT_STATUSES = CLIENT_STATUSES;
module.exports.RESPONSE_TYPES = RESPONSE_TYPES;
module.exports.DEMO_STATUSES = DEMO_STATUSES;
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
