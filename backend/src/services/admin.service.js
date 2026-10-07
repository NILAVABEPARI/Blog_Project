const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const { buildPageMeta, toSkip, escapeRegex } = require('../utils/pagination');

const getStats = async () => {
  const [users, posts, comments, deletedPosts] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments({ isDeleted: false }),
    Comment.countDocuments(),
    Post.countDocuments({ isDeleted: true }),
  ]);
  return { users, posts, comments, deletedPosts };
};

const listUsers = async ({ page, limit, search, role, isActive }) => {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const regex = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(toSkip(page, limit)).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
};

const getUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const updateUser = async (id, actor, data) => {
  const isSelf = String(actor._id) === String(id);
  if (isSelf && ((data.role && data.role !== actor.role) || data.isActive === false)) {
    throw ApiError.badRequest('You cannot change your own role or deactivate your own account');
  }

  const user = await getUser(id);
  Object.assign(user, data);
  await user.save();

  // A deactivated user loses every active session immediately
  if (data.isActive === false) {
    await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  }
  return user;
};

/**
 * Deletes the account and cleans up after it:
 * sessions are removed, their posts are soft-deleted (recoverable) and their comments removed.
 */
const deleteUser = async (id, actor) => {
  if (String(actor._id) === String(id)) throw ApiError.badRequest('You cannot delete your own account');

  const user = await getUser(id);

  await Promise.all([
    RefreshToken.deleteMany({ user: user._id }),
    Post.updateMany(
      { author: user._id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: actor._id } }
    ),
    Comment.deleteMany({ author: user._id }),
  ]);
  await user.deleteOne();
  return user;
};

module.exports = { getStats, listUsers, getUser, updateUser, deleteUser };
