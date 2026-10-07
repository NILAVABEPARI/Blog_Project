const router = require('express').Router();
const controller = require('../../controllers/comment.controller');
const commentService = require('../../services/comment.service');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { authorizeOwnerOrAdmin } = require('../../middleware/authorize');
const logActivity = require('../../middleware/activityLogger');
const { idParam } = require('../../validators/common.validator');
const { commentBodySchema } = require('../../validators/comment.validator');

const ownerOrAdmin = authorizeOwnerOrAdmin({
  loader: (req) => commentService.findById(req.params.id),
  resourceKey: 'comment',
});

router.use(authenticate);

router.patch(
  '/:id',
  validate({ params: idParam, body: commentBodySchema }),
  ownerOrAdmin,
  logActivity('COMMENT_UPDATED', 'Comment'),
  controller.update
);

router.delete(
  '/:id',
  validate({ params: idParam }),
  ownerOrAdmin,
  logActivity('COMMENT_DELETED', 'Comment'),
  controller.remove
);

module.exports = router;
