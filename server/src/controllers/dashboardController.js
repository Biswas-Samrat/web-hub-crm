const Client = require('../models/Client');

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      totalLeads,
      proposalsSent,
      positiveReplies,
      followUpsToday,
      overdueFollowUps,
      demosSent,
      ongoingProjects,
      deliveredProjects,
      completedProjects,
      lostLeads,
    ] = await Promise.all([
      Client.countDocuments({ userId, isArchived: false }),
      Client.countDocuments({ userId, isArchived: false, status: 'Proposal Sent' }),
      Client.countDocuments({ userId, isArchived: false, status: 'Positive Reply' }),
      Client.countDocuments({
        userId, isArchived: false,
        followUpAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Client.countDocuments({
        userId, isArchived: false,
        followUpAt: { $lt: startOfDay },
      }),
      Client.countDocuments({
        userId, isArchived: false,
        status: { $in: ['Demo Sent', 'Demo Liked'] },
      }),
      Client.countDocuments({ userId, isArchived: false, status: 'Ongoing Project' }),
      Client.countDocuments({ userId, isArchived: false, status: 'Website Delivered' }),
      Client.countDocuments({ userId, isArchived: false, status: 'Project Completed' }),
      Client.countDocuments({
        userId, isArchived: false,
        status: { $in: ['Lost', 'Not Interested', 'Do Not Contact'] },
      }),
    ]);

    // Recent activity (last 10 activity log entries across all clients)
    const recentActivityClients = await Client.find({
      userId,
      isArchived: false,
      'activityLog.0': { $exists: true },
    })
      .select('businessName activityLog')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const recentActivity = [];
    recentActivityClients.forEach(client => {
      const sorted = [...client.activityLog].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      sorted.slice(0, 2).forEach(log => {
        recentActivity.push({
          clientId: client._id,
          clientName: client.businessName,
          type: log.type,
          message: log.message,
          createdAt: log.createdAt,
        });
      });
    });

    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      stats: {
        totalLeads,
        proposalsSent,
        positiveReplies,
        followUpsToday,
        overdueFollowUps,
        demosSent,
        ongoingProjects,
        deliveredProjects,
        completedProjects,
        lostLeads,
      },
      recentActivity: recentActivity.slice(0, 15),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
