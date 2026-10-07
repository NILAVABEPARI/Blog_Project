const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');
const { buildPageMeta, toSkip } = require('../utils/pagination');

/** Fire-and-forget: an audit failure must never break the request that triggered it. */
const record = async (entry) => {
  try {
    await ActivityLog.create(entry);
  } catch (err) {
    logger.warn('Failed to record activity:', err.message);
  }
};

const list = async ({ page, limit, user, action }) => {
  const filter = {};
  if (user) filter.user = user;
  if (action) filter.action = action;

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(toSkip(page, limit))
      .limit(limit)
      .populate('user', 'name email')
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
};

module.exports = { record, list };
