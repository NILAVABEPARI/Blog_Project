const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const adminService = require('../services/admin.service');
const postService = require('../services/post.service');
const commentService = require('../services/comment.service');
const activityService = require('../services/activity.service');

const stats = asyncHandler(async (_req, res) => {
  sendSuccess(res, { message: 'Dashboard statistics', data: { stats: await adminService.getStats() } });
});

const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listUsers(req.validatedQuery);
  sendSuccess(res, { message: 'Users retrieved', data: { users: items }, meta });
});

const getUser = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: await adminService.getUser(req.params.id) } });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.user, req.body);
  sendSuccess(res, { message: 'User updated', data: { user } });
});

const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id, req.user);
  sendSuccess(res, { message: 'User deleted' });
});

const listPosts = asyncHandler(async (req, res) => {
  const { items, meta } = await postService.listAllPosts(req.validatedQuery);
  sendSuccess(res, { message: 'Posts retrieved', data: { posts: items }, meta });
});

const restorePost = asyncHandler(async (req, res) => {
  const post = await postService.restorePost(req.params.id);
  sendSuccess(res, { message: 'Post restored', data: { post } });
});

const permanentlyDeletePost = asyncHandler(async (req, res) => {
  await postService.permanentlyDeletePost(req.params.id);
  sendSuccess(res, { message: 'Post permanently deleted' });
});

const listComments = asyncHandler(async (req, res) => {
  const { items, meta } = await commentService.listAll(req.validatedQuery);
  sendSuccess(res, { message: 'Comments retrieved', data: { comments: items }, meta });
});

const activityLogs = asyncHandler(async (req, res) => {
  const { items, meta } = await activityService.list(req.validatedQuery);
  sendSuccess(res, { message: 'Activity logs retrieved', data: { logs: items }, meta });
});

module.exports = {
  stats,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listPosts,
  restorePost,
  permanentlyDeletePost,
  listComments,
  activityLogs,
};
