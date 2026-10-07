const activityService = require('../services/activity.service');

/**
 * logActivity('POST_CREATED', 'Post')
 * Records an audit entry once the response has finished successfully (status < 400).
 * Controllers can set res.locals.activityUserId (e.g. login/logout, where req.user is not set)
 * and res.locals.resourceId (e.g. the id of a newly created post).
 */
const logActivity = (action, resource) => (req, res, next) => {
  const paramId = req.params && req.params.id;

  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    activityService.record({
      user: (req.user && req.user._id) || res.locals.activityUserId,
      action,
      resource,
      resourceId: res.locals.resourceId || paramId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

module.exports = logActivity;
