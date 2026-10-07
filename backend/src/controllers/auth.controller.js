const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

const REFRESH_COOKIE = 'refreshToken';

// The refresh token lives in an httpOnly cookie scoped to the auth routes,
// so JavaScript (and therefore XSS) can never read it.
const cookieOptions = () => ({
  httpOnly: true,
  secure: env.IS_PROD || env.COOKIE_SAME_SITE === 'none',
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api/v1/auth',
});

const setRefreshCookie = (res, token, expiresAt) =>
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(), expires: expiresAt });

const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, cookieOptions());

const requestMeta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.register(req.body, requestMeta(req));
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.locals.activityUserId = user._id;
  res.locals.resourceId = user._id;
  sendSuccess(res, { statusCode: 201, message: 'Registration successful', data: { user, accessToken } });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.login(req.body, requestMeta(req));
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.locals.activityUserId = user._id;
  sendSuccess(res, { message: 'Login successful', data: { user, accessToken } });
});

const refresh = asyncHandler(async (req, res) => {
  try {
    const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.refresh(
      req.cookies && req.cookies[REFRESH_COOKIE],
      requestMeta(req)
    );
    setRefreshCookie(res, refreshToken, refreshExpiresAt);
    sendSuccess(res, { message: 'Token refreshed', data: { user, accessToken } });
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
});

const logout = asyncHandler(async (req, res) => {
  const userId = await authService.logout(req.cookies && req.cookies[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.locals.activityUserId = userId;
  sendSuccess(res, { message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
});

/** Shared by Google and Facebook: issue our own tokens, then hand control back to the SPA. */
const oauthCallback = asyncHandler(async (req, res) => {
  const { refreshToken, refreshExpiresAt } = await authService.issueTokens(req.user, requestMeta(req));
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.locals.activityUserId = req.user._id;
  // The SPA now calls POST /auth/refresh to exchange the cookie for an access token,
  // so no token ever appears in a URL.
  res.redirect(`${env.PRIMARY_CLIENT_URL}/oauth/callback`);
});

module.exports = { register, login, refresh, logout, me, oauthCallback };
