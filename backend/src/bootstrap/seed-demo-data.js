const mongoose = require('mongoose');
const User = require('../schema/user.model');
const Asset = require('../schema/asset.model');
const Order = require('../schema/order.model');
const passwordUtils = require('../utils/password');
const { updatePrice } = require('../state/market.state');
const { seedContentData } = require('./seed-content-data');
const {
  ensureMarketSnapshots,
  rebuildUserPortfolioSnapshots,
} = require('../modules/dashboard/services/snapshot-service');

const DEMO_USER_ID = new mongoose.Types.ObjectId('6996a0bdb9cbb8f0b60bce63');
const DEMO_PASSWORD = 'Demo@12345';

const demoDashboardProfile = {
  rangeLabel: 'Jan 2025 – Mar 2026',
  statCards: [
    { label: 'Portfolio Value', value: '$25,840', change: '+$15,840', pct: '+158.4%', up: true, color: '#3B82F6' },
    { label: 'Net Profit', value: '+$15,840', change: '+$2,420', pct: 'this month', up: true, color: '#16C784' },
    { label: 'Win Rate', value: '68.4%', change: '+4.2%', pct: 'last 30 days', up: true, color: '#8B5CF6' },
    { label: 'Profit Factor', value: '2.14', change: '+0.31', pct: 'vs last month', up: true, color: '#F59E0B' },
    { label: 'Max Drawdown', value: '-6.8%', change: '+1.2%', pct: 'improved', up: true, color: '#EA3943' },
    { label: 'Sharpe Ratio', value: '1.84', change: '+0.22', pct: 'vs benchmark', up: true, color: '#16C784' },
  ],
  portfolioData: [
    { date: 'Jan', value: 10000, drawdown: 0, benchmark: 10000 },
    { date: 'Feb', value: 10420, drawdown: 0, benchmark: 10280 },
    { date: 'Mar', value: 9800, drawdown: -5.9, benchmark: 10150 },
    { date: 'Apr', value: 11200, drawdown: 0, benchmark: 10620 },
    { date: 'May', value: 12400, drawdown: 0, benchmark: 11340 },
    { date: 'Jun', value: 11900, drawdown: -4, benchmark: 11180 },
    { date: 'Jul', value: 13500, drawdown: 0, benchmark: 12000 },
    { date: 'Aug', value: 14100, drawdown: 0, benchmark: 12800 },
    { date: 'Sep', value: 13200, drawdown: -6.4, benchmark: 12400 },
    { date: 'Oct', value: 15840, drawdown: 0, benchmark: 13600 },
    { date: 'Nov', value: 17200, drawdown: 0, benchmark: 14800 },
    { date: 'Dec', value: 19000, drawdown: 0, benchmark: 15900 },
    { date: "Jan'26", value: 22000, drawdown: 0, benchmark: 17400 },
    { date: "Feb'26", value: 20500, drawdown: -6.8, benchmark: 17100 },
    { date: "Mar'26", value: 25840, drawdown: 0, benchmark: 18600 },
  ],
  monthlyReturns: {
    '2025': [4.2, -5.9, 14.3, 10.7, -4, 13.4, 4.4, -6.4, 20, 8.5, 10.5, 15.8],
    '2026': [15.8, -6.8, 16.1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  rightMetrics: [
    { label: 'Average Win', value: '+$420', color: '#16C784' },
    { label: 'Average Loss', value: '-$202', color: '#EA3943' },
    { label: 'Risk per Trade', value: '1.2%', color: '#6B7280' },
    { label: 'Largest Win', value: '+$1,268', color: '#16C784' },
    { label: 'Largest Loss', value: '-$620', color: '#EA3943' },
    { label: 'Trade Expectancy', value: '+$182', color: '#3B82F6' },
  ],
  sessionSummary: {
    badge: 'Today',
    metrics: [
      { label: 'Trades', value: '12', color: '#3B82F6' },
      { label: 'Win Rate', value: '66.7%', color: '#22C55E' },
      { label: 'Session P&L', value: '+$1,840', color: '#22C55E' },
      { label: 'Mistakes', value: '3', color: '#F59E0B' },
      { label: 'Main Issue', value: 'Early Entries', color: '#EF4444' },
    ],
    score: 72,
  },
  recentTrades: [
    { asset: 'BTC/USDT', side: 'Long', entry: '$65,200', exit: '$67,542', profit: '+$1,268', strategy: 'Breakout', profitable: true },
    { asset: 'ETH/USDT', side: 'Long', entry: '$3,240', exit: '$3,580', profit: '+$680', strategy: 'Trend Follow', profitable: true },
    { asset: 'SOL/USDT', side: 'Short', entry: '$142', exit: '$128', profit: '+$420', strategy: 'RSI Reversal', profitable: true },
    { asset: 'BNB/USDT', side: 'Long', entry: '$580', exit: '$560', profit: '-$200', strategy: 'MA Cross', profitable: false },
    { asset: 'BTC/USDT', side: 'Short', entry: '$69,800', exit: '$71,200', profit: '-$420', strategy: 'Breakdown', profitable: false },
    { asset: 'ETH/USDT', side: 'Long', entry: '$3,100', exit: '$3,440', profit: '+$680', strategy: 'Support Bounce', profitable: true },
  ],
};

const seedAssets = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', type: 'CRYPTO', price: 67542, open: 64420, high: 68420, low: 64840, volume: 42800000000, changePercent: 4.82 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', type: 'CRYPTO', price: 3580, open: 3504.9, high: 3642, low: 3468, volume: 18200000000, changePercent: 2.14 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', type: 'CRYPTO', price: 142.4, open: 144.3, high: 147.6, low: 138.4, volume: 4100000000, changePercent: -1.32 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', type: 'CRYPTO', price: 584.2, open: 577.9, high: 592.8, low: 570.6, volume: 2600000000, changePercent: 1.08 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', type: 'CRYPTO', price: 0.618, open: 0.633, high: 0.64, low: 0.602, volume: 840000000, changePercent: -2.44 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', type: 'CRYPTO', price: 0.542, open: 0.5216, high: 0.552, low: 0.518, volume: 1900000000, changePercent: 3.91 },
];

const seedOrders = [
  { seedKey: 'demo-buy-btc-1', symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.08, price: 65200, total: 5216, status: 'FILLED', realizedPnL: 0, strategy: 'Breakout', createdAt: '2026-03-05T09:15:00.000Z' },
  { seedKey: 'demo-buy-eth-1', symbol: 'ETHUSDT', side: 'BUY', type: 'MARKET', quantity: 2, price: 3240, total: 6480, status: 'FILLED', realizedPnL: 0, strategy: 'Trend Follow', createdAt: '2026-03-10T11:30:00.000Z' },
  { seedKey: 'demo-buy-sol-1', symbol: 'SOLUSDT', side: 'BUY', type: 'MARKET', quantity: 20, price: 128, total: 2560, status: 'FILLED', realizedPnL: 0, strategy: 'RSI Reversal', createdAt: '2026-03-12T08:20:00.000Z' },
  { seedKey: 'demo-buy-bnb-1', symbol: 'BNBUSDT', side: 'BUY', type: 'MARKET', quantity: 6, price: 580, total: 3480, status: 'FILLED', realizedPnL: 0, strategy: 'MA Cross', createdAt: '2026-03-14T10:05:00.000Z' },
  { seedKey: 'demo-sell-eth-1', symbol: 'ETHUSDT', side: 'SELL', type: 'MARKET', quantity: 0.2, price: 3580, total: 716, status: 'FILLED', realizedPnL: 68, strategy: 'Trend Follow', createdAt: '2026-03-18T13:40:00.000Z' },
  { seedKey: 'demo-sell-sol-1', symbol: 'SOLUSDT', side: 'SELL', type: 'MARKET', quantity: 2, price: 142, total: 284, status: 'FILLED', realizedPnL: 28, strategy: 'RSI Reversal', createdAt: '2026-03-19T09:05:00.000Z' },
  { seedKey: 'demo-buy-btc-2', symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.02, price: 69800, total: 1396, status: 'FILLED', realizedPnL: 0, strategy: 'Breakdown', createdAt: '2026-03-20T15:10:00.000Z' },
  { seedKey: 'demo-open-btc-limit', symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', quantity: 0.03, price: 66850, limitPrice: 66850, total: 2005.5, status: 'OPEN', realizedPnL: 0, strategy: 'Support Bounce', createdAt: '2026-03-22T07:45:00.000Z' },
  { seedKey: 'demo-open-sol-limit', symbol: 'SOLUSDT', side: 'SELL', type: 'LIMIT', quantity: 4, price: 148, limitPrice: 148, total: 592, status: 'OPEN', realizedPnL: 0, strategy: 'VWAP', createdAt: '2026-03-22T08:10:00.000Z' },
  { seedKey: 'demo-cancelled-bnb-limit', symbol: 'BNBUSDT', side: 'SELL', type: 'LIMIT', quantity: 1, price: 612, limitPrice: 612, total: 612, status: 'CANCELLED', realizedPnL: 0, strategy: 'MA Cross', createdAt: '2026-03-21T12:00:00.000Z' },
];

let seeded = false;

const upsertDemoUser = async () => {
  const password = await passwordUtils.hashPassword(DEMO_PASSWORD);

  return User.findByIdAndUpdate(
    DEMO_USER_ID,
    {
      _id: DEMO_USER_ID,
      name: 'Alex Trader',
      email: 'user@gmail.com',
      password,
      role: 'user',
      status: 'active',
      wallet: {
        USDT: 6574,
        BTC: 0.1,
        ETH: 1.8,
        SOL: 18,
        BNB: 6,
      },
      dashboardProfile: demoDashboardProfile,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

const upsertAssets = async (userId) => {
  await Promise.all(
    seedAssets.map(({ symbol, baseAsset, quoteAsset, type }) =>
      Asset.findOneAndUpdate(
        { symbol },
        {
          symbol,
          baseAsset,
          quoteAsset,
          type,
          isActive: true,
          createdBy: userId,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )
    )
  );
};

const seedMarketPrices = () => {
  seedAssets.forEach((asset) => {
    updatePrice(asset.symbol, {
      symbol: asset.symbol,
      price: asset.price,
      open: asset.open,
      high: asset.high,
      low: asset.low,
      volume: asset.volume,
      changePercent: asset.changePercent,
      timestamp: new Date(),
    });
  });
};

const upsertOrders = async (userId) => {
  for (const order of seedOrders) {
    const existingOrder = await Order.findOne({ seedKey: order.seedKey });

    if (existingOrder) {
      await Order.updateOne(
        { _id: existingOrder._id },
        {
          $set: {
            user: userId,
            symbol: order.symbol,
            side: order.side,
            type: order.type,
            quantity: order.quantity,
            price: order.price,
            limitPrice: order.limitPrice || null,
            total: order.total,
            status: order.status,
            realizedPnL: order.realizedPnL,
            strategy: order.strategy,
          },
        }
      );
      continue;
    }

    await Order.create({
      user: userId,
      seedKey: order.seedKey,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      limitPrice: order.limitPrice || undefined,
      total: order.total,
      status: order.status,
      realizedPnL: order.realizedPnL,
      strategy: order.strategy,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.createdAt),
    });
  }
};

const seedDemoData = async () => {
  if (seeded) {
    seedMarketPrices();
    return;
  }

  const user = await upsertDemoUser();
  await upsertAssets(user._id);
  await upsertOrders(user._id);
  await seedContentData(user._id);
  seedMarketPrices();
  await ensureMarketSnapshots('BTCUSDT');
  await rebuildUserPortfolioSnapshots(user._id);
  seeded = true;
};

module.exports = {
  DEMO_PASSWORD,
  DEMO_USER_ID,
  seedDemoData,
};
