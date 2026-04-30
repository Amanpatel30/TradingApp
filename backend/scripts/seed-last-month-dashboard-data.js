const mongoose = require('mongoose');

const config = require('../src/config/config');
const User = require('../src/schema/user.model');
const Order = require('../src/schema/order.model');
const {
  rebuildUserPortfolioSnapshots,
  ensureMarketSnapshots,
} = require('../src/modules/dashboard/services/snapshot-service');

const SEED_PREFIX = 'dashboard-last-month-seed';

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

function buildLastMonthSeedOrders() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() - 1;

  return [
    {
      createdAt: new Date(Date.UTC(year, month, 4, 9, 15, 0)),
      symbol: 'BTCUSDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: 0.006,
      price: 63240,
      strategy: 'Breakout',
      realizedPnL: 118.45,
      stopLoss: 62100,
      takeProfit: 64500,
    },
    {
      createdAt: new Date(Date.UTC(year, month, 12, 11, 40, 0)),
      symbol: 'ETHUSDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: 0.22,
      price: 3185,
      strategy: 'Trend Follow',
      realizedPnL: -42.2,
      stopLoss: 3240,
      takeProfit: 3075,
    },
    {
      createdAt: new Date(Date.UTC(year, month, 21, 14, 5, 0)),
      symbol: 'SOLUSDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: 1.6,
      price: 141.8,
      strategy: 'RSI Reversal',
      realizedPnL: 67.8,
      stopLoss: 146,
      takeProfit: 136.2,
    },
  ].map((order, index) => ({
    ...order,
    total: round(order.quantity * order.price, 2),
    status: 'FILLED',
    executionSource: 'MANUAL_HISTORY_SEED',
    seedKey: `${SEED_PREFIX}-${index + 1}`,
    updatedAt: order.createdAt,
  }));
}

async function main() {
  const email = process.argv[2] || 'user@gmail.com';

  await mongoose.connect(config.mongodbUri);

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }

  const seedOrders = buildLastMonthSeedOrders();
  const existingOrders = await Order.find({
    user: user._id,
    seedKey: { $in: seedOrders.map((order) => order.seedKey) },
  }).lean();

  const existingSeedKeys = new Set(existingOrders.map((order) => order.seedKey));
  const missingOrders = seedOrders.filter((order) => !existingSeedKeys.has(order.seedKey));

  if (missingOrders.length) {
    await Order.insertMany(
      missingOrders.map((order) => ({
        ...order,
        user: user._id,
      }))
    );

    const wallet = user.wallet instanceof Map ? user.wallet : new Map(Object.entries(user.wallet || {}));
    const currentUsdt = Number(wallet.get('USDT') || 0);
    const walletAdjustment = missingOrders.reduce(
      (sum, order) => sum + Number(order.realizedPnL || 0),
      0
    );
    wallet.set('USDT', round(currentUsdt + walletAdjustment, 2));
    user.wallet = wallet;
    await user.save();
  }

  await ensureMarketSnapshots('BTCUSDT');
  const snapshots = await rebuildUserPortfolioSnapshots(user._id);

  const populatedMonths = snapshots.filter((snapshot) => Number(snapshot.monthlyReturn || 0) !== 0);

  console.log(
    JSON.stringify(
      {
        email: user.email,
        insertedOrders: missingOrders.length,
        seedOrders: seedOrders.map((order) => ({
          seedKey: order.seedKey,
          createdAt: order.createdAt,
          symbol: order.symbol,
          realizedPnL: order.realizedPnL,
        })),
        populatedMonths: populatedMonths.map((snapshot) => ({
          label: snapshot.label,
          periodStart: snapshot.periodStart,
          monthlyReturn: snapshot.monthlyReturn,
        })),
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
