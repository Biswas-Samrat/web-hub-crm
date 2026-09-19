const Client = require('../models/Client');
const { AppError } = require('../middleware/errorHandler');
const { stringify } = require('csv-stringify/sync');
const { parse } = require('csv-parse/sync');

// ─── Helper: Build search/filter query ────────────────────────────────────────
const buildQuery = (userId, queryParams) => {
  const query = { userId, isArchived: false };
  const {
    search,
    status,
    responseType,
    country,
    category,
    projectStatus,
    tag,
    filter,
  } = queryParams;

  // Text search
  if (search) {
    query.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { contactName: { $regex: search, $options: 'i' } },
      { facebookUrl: { $regex: search, $options: 'i' } },
      { website: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (status) query.status = status;
  if (responseType) query.responseType = responseType;
  if (country) query.country = { $regex: country, $options: 'i' };
  if (category) query.category = { $regex: category, $options: 'i' };
  if (projectStatus) query['project.status'] = projectStatus;
  if (tag) query.tags = { $in: [tag] };

  // Preset filters
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  switch (filter) {
    case 'today':
      query.followUpAt = { $gte: startOfDay, $lte: endOfDay };
      break;
    case 'this_week':
      query.followUpAt = { $gte: startOfWeek };
      break;
    case 'this_month':
      query.followUpAt = { $gte: startOfMonth };
      break;
    case 'follow_up_due':
      query.followUpAt = { $lte: new Date() };
      break;
    case 'overdue':
      query.followUpAt = { $lt: startOfDay };
      break;
    case 'positive_replies':
      query.status = 'Positive Reply';
      break;
    case 'demo':
      query.status = { $in: ['Demo Requested', 'Demo In Progress', 'Demo Sent', 'Demo Liked'] };
      break;
    case 'ongoing':
      query.status = 'Ongoing Project';
      break;
    case 'delivered':
      query.status = 'Website Delivered';
      break;
    case 'completed':
      query.status = 'Project Completed';
      break;
    case 'lost':
      query.status = { $in: ['Lost', 'Not Interested', 'Do Not Contact'] };
      break;
    case 'archived':
      query.isArchived = true;
      break;
  }

  // Remove isArchived override if specifically looking at archived
  if (filter === 'archived') {
    delete query.isArchived;
    query.isArchived = true;
  }

  return query;
};

// ─── GET /api/clients ──────────────────────────────────────────────────────────
const getClients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = buildQuery(req.user._id, req.query);

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-activityLog')
        .lean(),
      Client.countDocuments(query),
    ]);

    res.json({
      success: true,
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/clients ─────────────────────────────────────────────────────────
const createClient = async (req, res, next) => {
  try {
    const { facebookUrl, businessName } = req.body;

    if (!facebookUrl) {
      return res.status(400).json({ success: false, message: 'Facebook URL is required.' });
    }
    if (!businessName) {
      return res.status(400).json({ success: false, message: 'Business name is required.' });
    }

    // Duplicate URL check
    const normalized = Client.normalizeFacebookUrl(facebookUrl);
    const existing = await Client.findOne({
      userId: req.user._id,
      facebookUrlNormalized: normalized,
      isArchived: false,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `This Facebook profile already exists in your CRM (${existing.businessName}).`,
        existingClient: {
          id: existing._id,
          businessName: existing.businessName,
          status: existing.status,
        },
      });
    }

    const client = new Client({
      ...req.body,
      userId: req.user._id,
      facebookUrlNormalized: normalized,
    });

    // Initial activity
    client.addActivity('Client Created', `Client "${businessName}" added to CRM.`);

    if (req.body.status && req.body.status !== 'New Lead') {
      client.addActivity('Status Changed', `Status set to "${req.body.status}".`);
    }

    if (req.body.followUpAt) {
      client.addActivity(
        'Follow-Up Scheduled',
        `Follow-up scheduled for ${new Date(req.body.followUpAt).toLocaleDateString()}.`
      );
    }

    await client.save();

    res.status(201).json({
      success: true,
      message: 'Client created successfully.',
      client,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/clients/:id ──────────────────────────────────────────────────────
const getClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    res.json({ success: true, client });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/clients/:id ──────────────────────────────────────────────────────
const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    // If Facebook URL is changing, check for duplicates
    if (req.body.facebookUrl && req.body.facebookUrl !== client.facebookUrl) {
      const normalized = Client.normalizeFacebookUrl(req.body.facebookUrl);
      const existing = await Client.findOne({
        userId: req.user._id,
        facebookUrlNormalized: normalized,
        _id: { $ne: client._id },
        isArchived: false,
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `This Facebook profile already exists in your CRM (${existing.businessName}).`,
          existingClient: {
            id: existing._id,
            businessName: existing.businessName,
            status: existing.status,
          },
        });
      }
    }

    const prevStatus = client.status;

    // Update fields
    const allowedFields = [
      'businessName', 'contactName', 'facebookUrl', 'messengerUrl',
      'email', 'phone', 'website', 'country', 'city', 'category',
      'status', 'responseType', 'tags', 'notes', 'interestLevel',
      'proposalSentAt', 'firstContactAt', 'lastContactAt',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    if (req.body.facebookUrl) {
      client.facebookUrlNormalized = Client.normalizeFacebookUrl(req.body.facebookUrl);
    }

    // Log status change
    if (req.body.status && req.body.status !== prevStatus) {
      client.addActivity(
        'Status Changed',
        `Status changed from "${prevStatus}" to "${req.body.status}".`
      );
    }

    await client.save();

    res.json({ success: true, message: 'Client updated.', client });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/clients/:id/status ────────────────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { status, responseType } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const prevStatus = client.status;
    client.status = status;
    if (responseType) client.responseType = responseType;

    client.addActivity('Status Changed', `Status changed from "${prevStatus}" to "${status}".`);

    await client.save();
    res.json({ success: true, message: 'Status updated.', client });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/clients/:id/follow-up ─────────────────────────────────────────
const updateFollowUp = async (req, res, next) => {
  try {
    const { followUpAt, action } = req.body;

    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    if (action === 'complete') {
      client.followUpCompletedAt = new Date();
      client.lastContactAt = new Date();
      client.addActivity('Follow-Up Completed', 'Follow-up marked as completed.');

      if (followUpAt) {
        client.followUpAt = new Date(followUpAt);
        client.addActivity(
          'Follow-Up Scheduled',
          `Next follow-up scheduled for ${new Date(followUpAt).toLocaleDateString()}.`
        );
      } else {
        client.followUpAt = null;
      }
    } else if (action === 'snooze') {
      const snoozeMs = req.body.snoozeDays
        ? req.body.snoozeDays * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
      client.followUpAt = new Date(Date.now() + snoozeMs);
      client.addActivity(
        'Follow-Up Scheduled',
        `Follow-up snoozed to ${client.followUpAt.toLocaleDateString()}.`
      );
    } else {
      if (!followUpAt) {
        return res.status(400).json({ success: false, message: 'Follow-up date is required.' });
      }
      client.followUpAt = new Date(followUpAt);
      if (isNaN(client.followUpAt.getTime())) {
        return res.status(400).json({ success: false, message: 'Follow-up date is invalid.' });
      }
      client.addActivity(
        'Follow-Up Scheduled',
        `Follow-up scheduled for ${client.followUpAt.toLocaleDateString()}.`
      );
    }

    await client.save();
    res.json({ success: true, message: 'Follow-up updated.', client });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/clients/:id/activities ──────────────────────────────────────────
const addActivity = async (req, res, next) => {
  try {
    const { type, message, metadata } = req.body;
    if (!type || !message) {
      return res.status(400).json({ success: false, message: 'Activity type and message are required.' });
    }

    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    client.addActivity(type, message, metadata || {});
    await client.save();

    const activity = client.activityLog[client.activityLog.length - 1];
    res.status(201).json({ success: true, activity });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/clients/:id/demo ───────────────────────────────────────────────
const updateDemo = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const demoFields = ['requested', 'url', 'name', 'status', 'feedback', 'notes', 'createdAt', 'sentAt'];
    demoFields.forEach(field => {
      if (req.body[field] !== undefined) {
        client.demo[field] = req.body[field];
      }
    });

    // Log demo status changes
    if (req.body.status) {
      client.addActivity('Demo Sent', `Demo status updated to "${req.body.status}".`);
    }
    if (req.body.feedback) {
      client.addActivity('Demo Feedback', `Demo feedback recorded: "${req.body.feedback}".`);
    }

    await client.save();
    res.json({ success: true, message: 'Demo updated.', demo: client.demo });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/clients/:id/project ───────────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const projectFields = [
      'status', 'name', 'price', 'currency', 'startDate', 'targetDate',
      'deliveryDate', 'paymentStatus', 'liveUrl', 'notes', 'clientFeedback',
    ];
    const prevProjectStatus = client.project?.status;

    projectFields.forEach(field => {
      if (req.body[field] !== undefined) {
        client.project[field] = req.body[field];
      }
    });

    if (req.body.status && req.body.status !== prevProjectStatus) {
      client.addActivity(
        'Status Changed',
        `Project status changed to "${req.body.status}".`
      );

      if (req.body.status === 'Delivered') {
        client.status = 'Website Delivered';
        client.addActivity('Website Delivered', 'Website has been delivered to client.');
      }
      if (req.body.status === 'Completed') {
        client.status = 'Project Completed';
        client.addActivity('Status Changed', 'Project marked as completed.');
      }
    }

    await client.save();
    res.json({ success: true, message: 'Project updated.', project: client.project, client });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/clients/:id/convert ────────────────────────────────────────────
const convertToProject = async (req, res, next) => {
  try {
    const { projectName, price, currency, startDate, targetDate } = req.body;

    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    client.status = 'Ongoing Project';
    client.project.status = 'In Development';
    if (projectName) client.project.name = projectName;
    if (price) client.project.price = price;
    if (currency) client.project.currency = currency;
    if (startDate) client.project.startDate = new Date(startDate);
    else client.project.startDate = new Date();
    if (targetDate) client.project.targetDate = new Date(targetDate);

    client.addActivity('Client Converted', 'Lead converted to active project.');
    client.addActivity('Project Started', `Project "${projectName || client.businessName}" started.`);

    await client.save();
    res.json({ success: true, message: 'Client converted to project.', client });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/clients/:id/archive ───────────────────────────────────────────
const archiveClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    client.isArchived = !client.isArchived;
    client.archivedAt = client.isArchived ? new Date() : null;
    await client.save();

    res.json({
      success: true,
      message: client.isArchived ? 'Client archived.' : 'Client restored.',
      isArchived: client.isArchived,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/clients/:id ───────────────────────────────────────────────────
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    res.json({ success: true, message: 'Client permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/clients/export/csv ───────────────────────────────────────────────
const exportCSV = async (req, res, next) => {
  try {
    const clients = await Client.find({
      userId: req.user._id,
      isArchived: false,
    }).select('-activityLog -__v').lean();

    const rows = clients.map(c => ({
      businessName: c.businessName || '',
      contactName: c.contactName || '',
      facebookUrl: c.facebookUrl || '',
      email: c.email || '',
      phone: c.phone || '',
      website: c.website || '',
      country: c.country || '',
      city: c.city || '',
      category: c.category || '',
      status: c.status || '',
      responseType: c.responseType || '',
      tags: (c.tags || []).join(', '),
      notes: c.notes || '',
      followUpAt: c.followUpAt ? new Date(c.followUpAt).toISOString() : '',
      proposalSentAt: c.proposalSentAt ? new Date(c.proposalSentAt).toISOString() : '',
      lastContactAt: c.lastContactAt ? new Date(c.lastContactAt).toISOString() : '',
      demoUrl: c.demo?.url || '',
      demoStatus: c.demo?.status || '',
      projectStatus: c.project?.status || '',
      projectPrice: c.project?.price || '',
      projectCurrency: c.project?.currency || '',
      paymentStatus: c.project?.paymentStatus || '',
      liveUrl: c.project?.liveUrl || '',
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : '',
    }));

    const csv = stringify(rows, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="webhub-crm-export-${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/clients/import/csv ─────────────────────────────────────────────
const importCSV = async (req, res, next) => {
  try {
    if (!req.body.csv) {
      return res.status(400).json({ success: false, message: 'CSV data is required.' });
    }

    const records = parse(req.body.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = { created: 0, duplicates: [], errors: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        if (!row.facebookUrl || !row.businessName) {
          results.errors.push({ row: i + 1, reason: 'Missing required fields (facebookUrl, businessName)' });
          continue;
        }

        const normalized = Client.normalizeFacebookUrl(row.facebookUrl);
        const existing = await Client.findOne({
          userId: req.user._id,
          facebookUrlNormalized: normalized,
          isArchived: false,
        });

        if (existing) {
          results.duplicates.push({ row: i + 1, businessName: row.businessName, existingId: existing._id });
          continue;
        }

        const client = new Client({
          userId: req.user._id,
          businessName: row.businessName,
          contactName: row.contactName || '',
          facebookUrl: row.facebookUrl,
          facebookUrlNormalized: normalized,
          email: row.email || '',
          phone: row.phone || '',
          website: row.website || '',
          country: row.country || '',
          city: row.city || '',
          category: row.category || '',
          status: row.status || 'New Lead',
          responseType: row.responseType || undefined,
          notes: row.notes || '',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        });

        client.addActivity('Client Created', `Imported from CSV: "${row.businessName}".`);
        await client.save();
        results.created++;
      } catch (rowError) {
        results.errors.push({ row: i + 1, reason: rowError.message });
      }
    }

    res.json({
      success: true,
      message: `Import complete. ${results.created} created, ${results.duplicates.length} duplicates, ${results.errors.length} errors.`,
      results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  createClient,
  getClient,
  updateClient,
  updateStatus,
  updateFollowUp,
  addActivity,
  updateDemo,
  updateProject,
  convertToProject,
  archiveClient,
  deleteClient,
  exportCSV,
  importCSV,
};
