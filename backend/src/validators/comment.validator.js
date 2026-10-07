const { z } = require('zod');
const { paginationQuery } = require('./common.validator');

const commentBodySchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(1000),
});

const listCommentsQuery = paginationQuery;

module.exports = { commentBodySchema, listCommentsQuery };
