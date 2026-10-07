const { ZodError } = require('zod');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/** Translate library errors into ApiError so every failure has the same JSON shape. */
const normalize = (err) => {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return ApiError.unprocessable(
      'Validation failed',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    );
  }
  if (err.name === 'ValidationError' && err.errors) {
    return ApiError.unprocessable(
      'Validation failed',
      Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    );
  }
  if (err.name === 'CastError') return ApiError.badRequest(`Invalid value for ${err.path}`);
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    return ApiError.conflict(`Duplicate value for: ${fields || 'unique field'}`);
  }
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token expired');
  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');
  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body');
  if (err.type === 'entity.too.large') return new ApiError(413, 'Request body too large');

  return new ApiError(500, 'Internal server error', undefined, false);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const error = normalize(err);

  if (!error.isOperational) logger.error(err);

  const body = { success: false, message: error.message };
  if (error.errors) body.errors = error.errors;
  if (!env.IS_PROD && !error.isOperational) body.stack = err.stack;

  res.status(error.statusCode).json(body);
};

module.exports = errorHandler;
