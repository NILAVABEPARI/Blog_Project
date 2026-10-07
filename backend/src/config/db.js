const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

const disconnectDB = () => mongoose.disconnect();

module.exports = { connectDB, disconnectDB };
