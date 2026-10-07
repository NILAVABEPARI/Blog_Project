const router = require('express').Router();
const controller = require('../../controllers/admin.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const logActivity = require('../../middleware/activityLogger');
const { ROLES } = require('../../constants/roles');
const { idParam } = require('../../validators/common.validator');
const {
  listUsersQuery,
  updateUserSchema,
  adminListPostsQuery,
  adminListCommentsQuery,
  activityQuery,
} = require('../../validators/admin.validator');

// Every route below requires a valid token AND the admin role (enforced server-side)
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', controller.stats);

router.get('/users', validate({ query: listUsersQuery }), controller.listUsers);
router.get('/users/:id', validate({ params: idParam }), controller.getUser);
router.patch('/users/:id', validate({ params: idParam, body: updateUserSchema }), logActivity('ADMIN_USER_UPDATED', 'User'), controller.updateUser);
router.delete('/users/:id', validate({ params: idParam }), logActivity('ADMIN_USER_DELETED', 'User'), controller.deleteUser);

router.get('/posts', validate({ query: adminListPostsQuery }), controller.listPosts);
router.patch('/posts/:id/restore', validate({ params: idParam }), logActivity('ADMIN_POST_RESTORED', 'Post'), controller.restorePost);
router.delete('/posts/:id/permanent', validate({ params: idParam }), logActivity('ADMIN_POST_PURGED', 'Post'), controller.permanentlyDeletePost);

router.get('/comments', validate({ query: adminListCommentsQuery }), controller.listComments);
router.get('/activity-logs', validate({ query: activityQuery }), controller.activityLogs);

module.exports = router;
