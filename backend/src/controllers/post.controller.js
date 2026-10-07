const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const postService = require('../services/post.service');

const create = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body);
  res.locals.resourceId = post._id;
  sendSuccess(res, { statusCode: 201, message: 'Post created', data: { post } });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await postService.listPosts(req.validatedQuery);
  sendSuccess(res, { message: 'Posts retrieved', data: { posts: items }, meta });
});

const getOne = asyncHandler(async (req, res) => {
  const post = await postService.getPost(req.params.idOrSlug);
  sendSuccess(res, { message: 'Post retrieved', data: { post } });
});

// req.post is attached by authorizeOwnerOrAdmin
const update = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.post, req.body);
  sendSuccess(res, { message: 'Post updated', data: { post } });
});

const remove = asyncHandler(async (req, res) => {
  await postService.softDeletePost(req.post, req.user);
  sendSuccess(res, { message: 'Post deleted' });
});

module.exports = { create, list, getOne, update, remove };
