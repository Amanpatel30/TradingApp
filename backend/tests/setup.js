process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { initializeTransactionSupport } = require('../src/modules/orders/services/mongo-transaction-service');
const { closeWebSocketServer } = require('../src/websocket/ws.server');
const { resetMarketState } = require('../src/state/market.state');

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.MONGODB_URI = replSet.getUri('cryptosim-test');
  await mongoose.connect(process.env.MONGODB_URI);
  await initializeTransactionSupport();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  resetMarketState();
});

afterEach(() => {
  closeWebSocketServer();
});

afterAll(async () => {
  await mongoose.connection.close();

  if (replSet) {
    await replSet.stop();
  }
});
