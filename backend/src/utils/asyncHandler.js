// Express 5 forwards rejected promises automatically, but this wrapper keeps
// handlers explicit and also works if the app is ever run on Express 4.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
