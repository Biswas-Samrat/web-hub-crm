const Client = require('../models/Client');

const CLIENT_FIELDS = 'businessName contactName facebookUrl messengerUrl phone email website status responseType followUpAt lastContactAt notes category country';

// ─── GET /api/follow-ups (Queue: all pending follow-ups in order) ─────────────
const getFollowUpQueue = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const allFollowUps = await Client.find({
      userId: req.user._id,
      isArchived: false,
      followUpAt: { $exists: true, $ne: null },
    })
      .sort({ followUpAt: 1 })
      .select(CLIENT_FIELDS)
      .lean();

    const overdue = [];
    const today = [];
    const upcoming = [];

    allFollowUps.forEach((client) => {
      const fDate = new Date(client.followUpAt);
      if (fDate < startOfDay) {
        overdue.push(client);
      } else if (fDate <= endOfDay) {
        today.push(client);
      } else {
        upcoming.push(client);
      }
    });

    res.json({
      success: true,
      clients: allFollowUps,
      overdue,
      today,
      upcoming,
      counts: {
        total: allFollowUps.length,
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/follow-ups/today ────────────────────────────────────────────────
const getToday = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const clients = await Client.find({
      userId: req.user._id,
      isArchived: false,
      followUpAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ followUpAt: 1 })
      .select(CLIENT_FIELDS)
      .lean();

    res.json({ success: true, clients });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/follow-ups/overdue ──────────────────────────────────────────────
const getOverdue = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const clients = await Client.find({
      userId: req.user._id,
      isArchived: false,
      followUpAt: { $lt: startOfDay },
    })
      .sort({ followUpAt: 1 })
      .select(CLIENT_FIELDS)
      .lean();

    res.json({ success: true, clients });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/follow-ups/upcoming ─────────────────────────────────────────────
const getUpcoming = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59);

    const [tomorrow, thisWeek, later] = await Promise.all([
      Client.find({
        userId: req.user._id,
        isArchived: false,
        followUpAt: {
          $gte: startOfTomorrow,
          $lt: new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000),
        },
      })
        .sort({ followUpAt: 1 })
        .select(CLIENT_FIELDS)
        .lean(),

      Client.find({
        userId: req.user._id,
        isArchived: false,
        followUpAt: {
          $gte: new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000),
          $lte: endOfWeek,
        },
      })
        .sort({ followUpAt: 1 })
        .select(CLIENT_FIELDS)
        .lean(),

      Client.find({
        userId: req.user._id,
        isArchived: false,
        followUpAt: { $gt: endOfWeek },
      })
        .sort({ followUpAt: 1 })
        .limit(50)
        .select(CLIENT_FIELDS)
        .lean(),
    ]);

    const clients = [...tomorrow, ...thisWeek, ...later];

    res.json({ success: true, clients, tomorrow, thisWeek, later });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFollowUpQueue, getToday, getOverdue, getUpcoming };

