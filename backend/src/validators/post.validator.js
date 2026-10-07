const { z } = require('zod');
const { objectId, paginationQuery } = require('./common.validator');

const createPostSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  content: z.string().trim().min(10, 'Content must be at least 10 characters').max(20000),
});

const updatePostSchema = createPostSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

const listPostsQuery = paginationQuery.extend({
  search: z.string().trim().min(1).max(100).optional(),
  author: objectId.optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

const postIdOrSlugParam = z.object({ idOrSlug: z.string().trim().min(1).max(200) });
const postIdParam = z.object({ postId: objectId });

module.exports = {
  createPostSchema,
  updatePostSchema,
  listPostsQuery,
  postIdOrSlugParam,
  postIdParam,
};
