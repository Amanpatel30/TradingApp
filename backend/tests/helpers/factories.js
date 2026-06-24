const mongoose = require('mongoose');
const User = require('../../src/schema/user.model');
const Asset = require('../../src/schema/asset.model');
const Order = require('../../src/schema/order.model');
const Position = require('../../src/schema/position.model');
const passwordUtils = require('../../src/utils/password');
const jwtUtils = require('../../src/lib/jwt');
const { updatePrice } = require('../../src/state/market.state');

const buildUserPayload = (overrides = {}) => ({
  name: 'Test Trader',
  email: `trader-${new mongoose.Types.ObjectId()}@example.com`,
  password: 'Demo@12345',
  role: 'user',
  status: 'active',
  wallet: { USDT: 10000 },
  reservedWallet: { USDT: 0 },
  ...overrides,
});

const createUser = async (overrides = {}) => {
  const payload = buildUserPayload(overrides);
  const plainPassword = payload.password;
  const user = await User.create({
    ...payload,
    password: await passwordUtils.hashPassword(plainPassword),
  });

  return { user, plainPassword };
};

const authHeadersFor = (user) => ({
  Authorization: `Bearer ${jwtUtils.generateAccessToken({ id: user._id, email: user.email, role: user.role })}`,
});

const createAsset = (createdBy, overrides = {}) =>
  Asset.create({
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    type: 'CRYPTO',
    isActive: true,
    createdBy,
    ...overrides,
  });

const seedMarketPrice = (symbol = 'BTCUSDT', overrides = {}) =>
  updatePrice(symbol, {
    symbol,
    price: 50000,
    timestamp: Date.now(),
    ...overrides,
  });

const createOrder = (user, overrides = {}) =>
  Order.create({
    user: user._id || user,
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    quantity: 0.1,
    price: 50000,
    total: 5000,
    status: 'FILLED',
    realizedPnL: 0,
    strategy: 'Breakout',
    clientOrderId: `test-order-${new mongoose.Types.ObjectId()}`,
    ...overrides,
  });

const createPosition = (user, overrides = {}) =>
  Position.create({
    user: user._id || user,
    symbol: 'BTCUSDT',
    side: 'LONG',
    quantity: 0.1,
    entryPrice: 50000,
    initialMargin: 5000,
    stopLoss: 49000,
    takeProfit: 52000,
    status: 'OPEN',
    strategy: 'Breakout',
    clientOrderId: `test-order-${new mongoose.Types.ObjectId()}`,
    ...overrides,
  });

module.exports = {
  authHeadersFor,
  buildUserPayload,
  createAsset,
  createOrder,
  createPosition,
  createUser,
  seedMarketPrice,
};
