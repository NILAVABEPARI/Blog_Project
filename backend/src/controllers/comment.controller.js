const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const commentService = require('../services/comment.service');

const create = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.params.postId, req.user._id, req.body);
  res.locals.resourceId = comment._id;
  sendSuccess(res, { statusCode: 201, message: 'Comment added', data: { comment } });
});

const listForPost = asyncHandler(async (req, res) => {
  const { items, meta } = await commentService.listForPost(req.params.postId, req.validatedQuery);
  sendSuccess(res, { message: 'Comments retrieved', data: { comments: items }, meta });
});

// req.comment is attached by authorizeOwnerOrAdmin
const update = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(req.comment, req.body);
  sendSuccess(res, { message: 'Comment updated', data: { comment } });
});

const remove = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.comment);
  sendSuccess(res, { message: 'Comment deleted' });
});

module.exports = { create, listForPost, update, remove };
