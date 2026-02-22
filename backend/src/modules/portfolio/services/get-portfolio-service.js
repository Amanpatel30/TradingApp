const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
const { getPrice } = require('../../../state/market.state');

/**
 * Build a detailed portfolio with unrealized & realized PnL.
 *
 * @param {String} userId - Authenticated user's _id
 * @returns {Object} { balances, assets, totalPortfolioValue, totalUnrealizedPnL, totalRealizedPnL }
 */
const getPortfolio = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const { BadRequestError } = require('../../../utils/custom-error');
    throw new BadRequestError('User not found');
  }

  // ── Convert wallet Map → plain object ────────────────────────
  const balances =
    user.wallet instanceof Map
      ? Object.fromEntries(user.wallet)
      : user.wallet || {};

  // ── Per-asset breakdown ──────────────────────────────────────
  const assets = [];
  let totalPortfolioValue = 0;
  let totalUnrealizedPnL = 0;

  for (const [asset, balance] of Object.entries(balances)) {
    // USDT is the quote currency — add it straight to portfolio value
    if (asset === 'USDT') {
      totalPortfolioValue += balance;
      continue;
    }

    // Skip assets with zero or negative balance
    if (!balance || balance <= 0) continue;

    const symbol = `${asset}USDT`;

    // ── Live market price ────────────────────────────────────
    const marketData = getPrice(symbol);
    const currentPrice =
      marketData && marketData.price ? parseFloat(marketData.price) : null;

    // ── Historical BUY orders for avg-cost basis ─────────────
    const buyOrders = await Order.find({
      user: userId,
      symbol,
      side: 'BUY',
      status: 'FILLED',
    }).lean();

    let totalBuyQuantity = 0;
    let totalBuyValue = 0;

    for (const order of buyOrders) {
      totalBuyQuantity += order.quantity;
      totalBuyValue += order.total; // quantity × price at fill
    }

    const avgBuyPrice =
      totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;

    // ── Value & PnL ──────────────────────────────────────────
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
    });
  }

  // ── Realized PnL from all SELL orders ──────────────────────────
  const sellOrders = await Order.find({
    user: userId,
    side: 'SELL',
    status: 'FILLED',
  }).lean();

  let totalRealizedPnL = 0;
  for (const order of sellOrders) {
    totalRealizedPnL += order.realizedPnL || 0;
  }

  return {
    balances,
    assets,
    totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(8)),
    totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(8)),
    totalRealizedPnL: parseFloat(totalRealizedPnL.toFixed(6)),
  };
};

module.exports = { getPortfolio };
