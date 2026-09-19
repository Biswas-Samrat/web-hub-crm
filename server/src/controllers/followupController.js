const Client = require('../models/Client');

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
      .select('businessName facebookUrl status responseType followUpAt lastContactAt notes category country')
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
      .select('businessName facebookUrl status responseType followUpAt lastContactAt notes category country')
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
    const beyond = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 0, 0, 0);

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
        .select('businessName facebookUrl status responseType followUpAt lastContactAt category country')
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
        .select('businessName facebookUrl status responseType followUpAt lastContactAt category country')
        .lean(),

      Client.find({
        userId: req.user._id,
        isArchived: false,
        followUpAt: { $gt: endOfWeek },
      })
        .sort({ followUpAt: 1 })
        .limit(20)
        .select('businessName facebookUrl status responseType followUpAt lastContactAt category country')
        .lean(),
    ]);

    res.json({ success: true, tomorrow, thisWeek, later });
  } catch (error) {
    next(error);
  }
};

module.exports = { getToday, getOverdue, getUpcoming };
