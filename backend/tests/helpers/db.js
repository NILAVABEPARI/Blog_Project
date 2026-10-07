const crypto = require('crypto');
const mongoose = require('mongoose');
const models = require('../../src/models');

let mongod;

/**
 * Uses TEST_MONGO_URI if set (e.g. a local MongoDB / CI service container),
 * otherwise spins up an in-memory MongoDB. Each test file gets its own database.
 */
exports.connect = async () => {
  if (process.env.TEST_MONGO_URI) {
    await mongoose.connect(process.env.TEST_MONGO_URI, { dbName: `blog_test_${crypto.randomBytes(4).toString('hex')}` });
  } else {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
  // Build indexes. TEST_SKIP_INDEX_ERRORS is only for MongoDB-compatible servers (e.g. FerretDB)
  // that lack text/TTL indexes; against real MongoDB leave it unset.
  await Promise.all(
    Object.values(models).map((m) => (process.env.TEST_SKIP_INDEX_ERRORS ? m.init().catch(() => {}) : m.init()))
  );
};

exports.clear = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
};

exports.disconnect = async () => {
  if (process.env.TEST_MONGO_URI) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
