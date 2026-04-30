const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
const Position = require('../../../schema/position.model');
const { getPrice } = require('../../../state/market.state');

const getPortfolio = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const { BadRequestError } = require('../../../utils/custom-error');
    throw new BadRequestError('User not found');
  }

  const balances =
    user.wallet instanceof Map
      ? Object.fromEntries(user.wallet)
      : user.wallet || {};
  const reservedBalances =
    user.reservedWallet instanceof Map
      ? Object.fromEntries(user.reservedWallet)
      : user.reservedWallet || {};

  const [positions, sellOrders] = await Promise.all([
    Position.find({ user: userId, status: 'OPEN' }).lean(),
    Order.find({
      user: userId,
      status: 'FILLED',
      realizedPnL: { $ne: 0 },
    }).lean(),
  ]);

  const assets = [];
  let totalPortfolioValue = 0;
  let totalUnrealizedPnL = 0;

  for (const [asset, balance] of Object.entries(balances)) {
    if (!balance || balance <= 0) {
      continue;
    }

    if (asset === 'USDT') {
      totalPortfolioValue += Number(balance || 0);
      continue;
    }

    const symbol = `${asset}USDT`;
    const marketData = getPrice(symbol);
    const currentPrice =
      marketData && marketData.price ? parseFloat(marketData.price) : null;

    const buyOrders = await Order.find({
      user: userId,
      symbol,
      side: 'BUY',
      status: 'FILLED',
      realizedPnL: 0,
    }).lean();

    let totalBuyQuantity = 0;
    let totalBuyValue = 0;

    for (const order of buyOrders) {
      totalBuyQuantity += order.quantity;
      totalBuyValue += order.total;
    }

    const avgBuyPrice = totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;
    const currentValue = currentPrice ? balance * currentPrice : 0;
    const costBasis = balance * avgBuyPrice;
    const unrealizedPnL = currentPrice ? currentValue - costBasis : 0;

    totalPortfolioValue += currentValue;
    totalUnrealizedPnL += unrealizedPnL;

    assets.push({
      asset,
      balance,
      symbol,
      avgBuyPrice: parseFloat(avgBuyPrice.toFixed(8)),
      currentPrice: currentPrice ? parseFloat(currentPrice.toFixed(8)) : null,
      currentValue: parseFloat(currentValue.toFixed(8)),
      unrealizedPnL: parseFloat(unrealizedPnL.toFixed(8)),
      totalBuyQuantity: parseFloat(totalBuyQuantity.toFixed(8)),
      totalBuyValue: parseFloat(totalBuyValue.toFixed(8)),
      kind: 'SPOT_ASSET',
    });
  }

  Object.entries(reservedBalances).forEach(([asset, amount]) => {
    if (!amount || amount <= 0) {
      return;
    }

    totalPortfolioValue += Number(amount || 0);
  });

  const openPositions = positions.map((position) => {
    const marketData = getPrice(position.symbol) || {};
    const currentPrice = Number(marketData.price || position.entryPrice || 0);
    const multiplier = position.side === 'LONG' ? 1 : -1;
    const unrealizedPnL =
      (currentPrice - Number(position.entryPrice || 0)) *
      Number(position.quantity || 0) *
      multiplier;

    totalUnrealizedPnL += unrealizedPnL;
    totalPortfolioValue += unrealizedPnL;

    return {
      id: String(position._id),
      symbol: position.symbol,
      side: position.side,
      quantity: Number(position.quantity || 0),
      entryPrice: Number(position.entryPrice || 0),
      currentPrice,
      currentValue: Number(position.initialMargin || 0) + unrealizedPnL,
      initialMargin: Number(position.initialMargin || 0),
      stopLoss: Number(position.stopLoss || 0),
      takeProfit: Number(position.takeProfit || 0),
      unrealizedPnL: Number(unrealizedPnL.toFixed(8)),
      strategy: position.strategy || 'Unlabeled',
      kind: 'OPEN_POSITION',
    };
  });

  let totalRealizedPnL = 0;
  for (const order of sellOrders) {
    totalRealizedPnL += order.realizedPnL || 0;
  }

  return {
    balances,
    reservedBalances,
    assets,
    openPositions,
    availableUsdt: parseFloat(Number(balances.USDT || 0).toFixed(6)),
    reservedUsdt: parseFloat(Number(reservedBalances.USDT || 0).toFixed(6)),
    totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(8)),
    totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(8)),
    totalRealizedPnL: parseFloat(totalRealizedPnL.toFixed(6)),
  };
};

module.exports = { getPortfolio };
