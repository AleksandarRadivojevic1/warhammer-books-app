const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Spins up an in-memory MongoDB instance for testing.
// Tests never touch the real database.
const connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

const disconnect = async () => {
  await mongoose.disconnect();
  await mongod.stop();
};

// Wipes all collections between tests so each test starts with a clean slate.
const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, disconnect, clear };
