const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

/** Role-based access control: allow only the listed roles. Must run after authenticate. */
const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };

/**
 * Resource-level permission: the owner or an admin may proceed.
 * `loader(req)` fetches the resource (return null if missing); it is attached to
 * req[resourceKey] so the controller does not need to query it again.
 */
const authorizeOwnerOrAdmin = ({ loader, ownerField = 'author', resourceKey = 'resource' }) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();

    const resource = await loader(req);
    if (!resource) throw ApiError.notFound();

    const owner = resource[ownerField];
    const ownerId = owner && owner._id ? owner._id : owner;
    const isOwner = ownerId && String(ownerId) === String(req.user._id);

    if (!isOwner && req.user.role !== ROLES.ADMIN) {
      throw ApiError.forbidden('You can only modify your own content');
    }

    req[resourceKey] = resource;
    next();
  });

module.exports = { authorize, authorizeOwnerOrAdmin };
