const { z } = require('zod');
const { ROLES } = require('../constants/roles');
const { objectId, paginationQuery } = require('./common.validator');

const boolString = z.enum(['true', 'false']).transform((v) => v === 'true');

const listUsersQuery = paginationQuery.extend({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  isActive: boolString.optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(50),
    role: z.enum(Object.values(ROLES)),
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

const adminListPostsQuery = paginationQuery.extend({
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['active', 'deleted', 'all']).default('active'),
});

const adminListCommentsQuery = paginationQuery.extend({
  post: objectId.optional(),
  author: objectId.optional(),
});

const activityQuery = paginationQuery.extend({
  user: objectId.optional(),
  action: z.string().trim().max(50).optional(),
});

module.exports = {
  listUsersQuery,
  updateUserSchema,
  adminListPostsQuery,
  adminListCommentsQuery,
  activityQuery,
};
