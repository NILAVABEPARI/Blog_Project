const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const createLimiter = ({
  windowMs,
  limit,
  message = 'Too many requests, please try again later',
  skipSuccessfulRequests = false,
  skip = () => false,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip,
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  });

const skipInTest = () => env.NODE_ENV === 'test';
const FIFTEEN_MIN = 15 * 60 * 1000;

module.exports = {
  createLimiter,
  // Whole API: generic flood protection
  globalLimiter: createLimiter({ windowMs: FIFTEEN_MIN, limit: env.GLOBAL_RATE_LIMIT_MAX, skip: skipInTest }),
  // Registration and OAuth start
  authLimiter: createLimiter({
    windowMs: FIFTEEN_MIN,
    limit: env.AUTH_RATE_LIMIT_MAX,
    message: 'Too many authentication attempts, please try again in 15 minutes',
    skip: skipInTest,
  }),
  // Login: only failed attempts count, which blunts brute-force attacks
  loginLimiter: createLimiter({
    windowMs: FIFTEEN_MIN,
    limit: env.AUTH_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true,
    message: 'Too many failed login attempts, please try again in 15 minutes',
    skip: skipInTest,
  }),
  // The SPA calls refresh often, so this one is looser
  refreshLimiter: createLimiter({ windowMs: FIFTEEN_MIN, limit: env.AUTH_RATE_LIMIT_MAX * 6, skip: skipInTest }),
};
