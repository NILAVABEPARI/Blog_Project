const router = require('express').Router();
const postController = require('../../controllers/post.controller');
const commentController = require('../../controllers/comment.controller');
const postService = require('../../services/post.service');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { authorizeOwnerOrAdmin } = require('../../middleware/authorize');
const logActivity = require('../../middleware/activityLogger');
const { idParam } = require('../../validators/common.validator');
const {
  createPostSchema,
  updatePostSchema,
  listPostsQuery,
  postIdOrSlugParam,
  postIdParam,
} = require('../../validators/post.validator');
const { commentBodySchema, listCommentsQuery } = require('../../validators/comment.validator');

const ownerOrAdmin = authorizeOwnerOrAdmin({
  loader: (req) => postService.findActiveById(req.params.id),
  resourceKey: 'post',
});

// ----- public -----
router.get('/', validate({ query: listPostsQuery }), postController.list);
router.get('/:idOrSlug', validate({ params: postIdOrSlugParam }), postController.getOne);

// ----- comments on a post -----
router.get('/:postId/comments', validate({ params: postIdParam, query: listCommentsQuery }), commentController.listForPost);
router.post(
  '/:postId/comments',
  authenticate,
  validate({ params: postIdParam, body: commentBodySchema }),
  logActivity('COMMENT_CREATED', 'Comment'),
  commentController.create
);

// ----- authenticated -----
router.post('/', authenticate, validate({ body: createPostSchema }), logActivity('POST_CREATED', 'Post'), postController.create);

router.patch(
  '/:id',
  authenticate,
  validate({ params: idParam, body: updatePostSchema }),
  ownerOrAdmin,
  logActivity('POST_UPDATED', 'Post'),
  postController.update
);

router.delete(
  '/:id',
  authenticate,
  validate({ params: idParam }),
  ownerOrAdmin,
  logActivity('POST_DELETED', 'Post'),
  postController.remove
);

module.exports = router;
