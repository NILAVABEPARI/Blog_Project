const crypto = require('crypto');
const mongoose = require('mongoose');
const slugify = require('slugify');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const { buildPageMeta, toSkip, escapeRegex } = require('../utils/pagination');

// Only the fields the UI needs: avoids pulling email/role/etc. into public responses
const AUTHOR = { path: 'author', select: 'name avatar' };

/** "Hello World!" -> "hello-world"; appends a random suffix if the slug is taken. */
const generateUniqueSlug = async (title) => {
  const base = slugify(title, { lower: true, strict: true, trim: true }).slice(0, 80) || 'post';
  let slug = base;
  while (await Post.exists({ slug })) {
    slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }
  return slug;
};

const createPost = async (authorId, { title, content }) => {
  const slug = await generateUniqueSlug(title);
  const post = await Post.create({ title, content, slug, author: authorId });
  await post.populate(AUTHOR);
  return post;
};

const listPosts = async ({ page, limit, search, author, sort }) => {
  const filter = { isDeleted: false };
  if (author) filter.author = author;
  if (search) filter.$text = { $search: search };

  const [items, total] = await Promise.all([
    Post.find(filter)
      .select('-content') // list view uses the stored excerpt
      .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
      .skip(toSkip(page, limit))
      .limit(limit)
      .populate(AUTHOR)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
};

const getPost = async (idOrSlug) => {
  const query = mongoose.isValidObjectId(idOrSlug) && /^[0-9a-fA-F]{24}$/.test(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

  const post = await Post.findOne({ ...query, isDeleted: false }).populate(AUTHOR).lean();
  if (!post) throw ApiError.notFound('Post not found');
  return post;
};

/** Returns the Mongoose document (or null). Used by the ownership middleware. */
const findActiveById = (id) => Post.findOne({ _id: id, isDeleted: false });

// The slug is intentionally not regenerated on edit so public URLs stay stable
const updatePost = async (post, { title, content }) => {
  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  await post.save();
  await post.populate(AUTHOR);
  return post;
};

const softDeletePost = async (post, actor) => {
  post.isDeleted = true;
  post.deletedAt = new Date();
  post.deletedBy = actor._id;
  await post.save();
  return post;
};

// ----- admin operations -----

const listAllPosts = async ({ page, limit, search, status }) => {
  const filter = {};
  if (status === 'active') filter.isDeleted = false;
  if (status === 'deleted') filter.isDeleted = true;
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

  const [items, total] = await Promise.all([
    Post.find(filter)
      .select('-content')
      .sort({ createdAt: -1 })
      .skip(toSkip(page, limit))
      .limit(limit)
      .populate(AUTHOR)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
};

const restorePost = async (id) => {
  const post = await Post.findOne({ _id: id, isDeleted: true });
  if (!post) throw ApiError.notFound('Deleted post not found');

  post.isDeleted = false;
  post.deletedAt = undefined;
  post.deletedBy = undefined;
  await post.save();
  await post.populate(AUTHOR);
  return post;
};

const permanentlyDeletePost = async (id) => {
  const post = await Post.findByIdAndDelete(id);
  if (!post) throw ApiError.notFound('Post not found');
  await Comment.deleteMany({ post: id });
  return post;
};

module.exports = {
  generateUniqueSlug,
  createPost,
  listPosts,
  getPost,
  findActiveById,
  updatePost,
  softDeletePost,
  listAllPosts,
  restorePost,
  permanentlyDeletePost,
};
