const router = require('express').Router();
const controller = require('../../controllers/auth.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const logActivity = require('../../middleware/activityLogger');
const { authLimiter, loginLimiter, refreshLimiter } = require('../../middleware/rateLimiter');
const { ensureProvider, oauthStart, oauthCallback } = require('../../middleware/oauth');
const { registerSchema, loginSchema } = require('../../validators/auth.validator');

router.post('/register', authLimiter, validate({ body: registerSchema }), logActivity('USER_REGISTERED', 'User'), controller.register);
router.post('/login', loginLimiter, validate({ body: loginSchema }), logActivity('USER_LOGIN', 'User'), controller.login);
router.post('/refresh', refreshLimiter, controller.refresh);
router.post('/logout', logActivity('USER_LOGOUT', 'User'), controller.logout);
router.get('/me', authenticate, controller.me);

// OAuth 2.0 (Authorization Code flow via Passport)
['google', 'facebook'].forEach((provider) => {
  router.get(`/${provider}`, authLimiter, ensureProvider(provider), oauthStart(provider));
  router.get(
    `/${provider}/callback`,
    ensureProvider(provider),
    oauthCallback(provider),
    logActivity(`USER_LOGIN_${provider.toUpperCase()}`, 'User'),
    controller.oauthCallback
  );
});

module.exports = router;
