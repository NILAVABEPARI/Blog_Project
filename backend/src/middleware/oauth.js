const passport = require('passport');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { isProviderConfigured } = require('../config/passport');

const SCOPES = { google: ['profile', 'email'], facebook: ['email'] };

const ensureProvider = (provider) => (_req, _res, next) =>
  isProviderConfigured(provider)
    ? next()
    : next(ApiError.notImplemented(`${provider} login is not configured on this server`));

const oauthStart = (provider) => passport.authenticate(provider, { scope: SCOPES[provider], session: false });

// Failures redirect to the SPA's login page instead of returning JSON to the browser
const oauthCallback = (provider) => (req, res, next) =>
  passport.authenticate(provider, { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${env.PRIMARY_CLIENT_URL}/login?error=oauth_failed`);
    req.user = user;
    next();
  })(req, res, next);

module.exports = { ensureProvider, oauthStart, oauthCallback };
