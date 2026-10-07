const router = require('express').Router();
const mongoose = require('mongoose');

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: { uptime: process.uptime(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' },
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/posts', require('./post.routes'));
router.use('/comments', require('./comment.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
