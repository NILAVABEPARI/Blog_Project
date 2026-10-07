class ApiError extends Error {
  constructor(statusCode, message, errors, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }
  static unprocessable(message = 'Validation failed', errors) {
    return new ApiError(422, message, errors);
  }
  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, message);
  }
  static notImplemented(message = 'Not implemented') {
    return new ApiError(501, message);
  }
}

module.exports = ApiError;
