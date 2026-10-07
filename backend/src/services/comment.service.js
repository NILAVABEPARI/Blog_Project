const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { buildPageMeta, toSkip } = require('../utils/pagination');

const AUTHOR = { path: 'author', select: 'name avatar' };

const assertPostExists = async (postId) => {
  if (!(await Post.exists({ _id: postId, isDeleted: false }))) throw ApiError.notFound('Post not found');
};

const createComment = async (postId, authorId, { content }) => {
  await assertPostExists(postId);
  const comment = await Comment.create({ post: postId, author: authorId, content });
  await comment.populate(AUTHOR);
  return comment;
};

const listForPost = async (postId, { page, limit }) => {
  await assertPostExists(postId);

  const filter = { post: postId };
  const [items, total] = await Promise.all([
    Comment.find(filter).sort({ createdAt: -1 }).skip(toSkip(page, limit)).limit(limit).populate(AUTHOR).lean(),
    Comment.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
};

const findById = (id) => Comment.findById(id);

const updateComment = async (comment, { content }) => {
  comment.content = content;
  comment.isEdited = true;
  await comment.save();
  await comment.populate(AUTHOR);
  return comment;
};

const deleteComment = (comment) => comment.deleteOne();

// ----- admin -----
const listAll = async ({ page, limit, post, author }) => {
  const filter = {};
  if (post) filter.post = post;
  if (author) filter.author = author;

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(toSkip(page, limit))
      .limit(limit)
      .populate(AUTHOR)
      .populate({ path: 'post', select: 'title slug' })
      .lean(),
    Comment.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
};

module.exports = { createComment, listForPost, findById, updateComment, deleteComment, listAll };
