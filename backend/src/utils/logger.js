const env = require('../config/env');

const silent = env.NODE_ENV === 'test';
const stamp = () => new Date().toISOString();

const logger = {
  info: (...args) => !silent && console.log(`[${stamp()}] INFO `, ...args),
  warn: (...args) => !silent && console.warn(`[${stamp()}] WARN `, ...args),
  error: (...args) => !silent && console.error(`[${stamp()}] ERROR`, ...args),
};

module.exports = logger;
