const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
const { BadRequestError } = require('../../../utils/custom-error');
const { getPortfolio } = require('../../portfolio/services/get-portfolio-service');
const {
  calculateRiskPercent,
  enforceRiskLimit,
  normalizeStrategy,
  round,
  validateProtectiveLevels,
} = require('./trading-engine-utils');
const {
  reserveWalletBalanceAtomic,
  releaseReservedWalletBalanceAtomic,
} = require('./wallet-atomic-service');
const { runWithMongoTransaction } = require('./mongo-transaction-service');
const { emitPortfolioUpdated, emitUserTradingEvent } = require('./trading-realtime-service');

const placeLimitOrder = async ({
  userId,
  symbol,
  side,
  quantity,
  limitPrice,
  strategy,
  stopLoss,
  takeProfit,
  clientOrderId,
}) => {
  if (!symbol || !side || !quantity || !limitPrice) {
    throw new BadRequestError('Please provide symbol, side, quantity, and limitPrice');
  }

  const upperSide = String(side || '').toUpperCase();
  if (!['BUY', 'SELL'].includes(upperSide)) {
    throw new BadRequestError('Side must be either BUY or SELL');
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new BadRequestError('Quantity must be a positive number');
  }

  if (typeof limitPrice !== 'number' || limitPrice <= 0) {
    throw new BadRequestError('Limit price must be a positive number');
  }

  const protectiveLevels = validateProtectiveLevels({
    side: upperSide,
    entryPrice: limitPrice,
    stopLoss,
    takeProfit,
  });

  const [user, portfolio] = await Promise.all([
    User.findById(userId),
    getPortfolio(userId),
  ]);

  if (!user) {
    throw new BadRequestError('User not found');
  }

  const reservedAmount = round(limitPrice * quantity, 6);
  const riskPercent = calculateRiskPercent({
    entryPrice: limitPrice,
    stopLoss: protectiveLevels.stopLoss,
    quantity,
    accountEquity: portfolio.totalPortfolioValue || user.wallet.get('USDT') || 0,
  });
  enforceRiskLimit({ riskPercent });

  const normalizedSymbol = String(symbol || '').replace('/', '').toUpperCase();
  const normalizedStrategy = normalizeStrategy(strategy);

  const result = await runWithMongoTransaction(async ({ session, transactional }) => {
    const updatedUser = await reserveWalletBalanceAtomic({
      userId,
      asset: 'USDT',
      amount: reservedAmount,
      session,
    });

    try {
      const [order] = await Order.create(
        [
          {
            user: userId,
            symbol: normalizedSymbol,
            side: upperSide,
            type: 'LIMIT',
            quantity,
            price: limitPrice,
            limitPrice,
            total: reservedAmount,
            status: 'OPEN',
            realizedPnL: 0,
            stopLoss: protectiveLevels.stopLoss,
            takeProfit: protectiveLevels.takeProfit,
            reservedAsset: 'USDT',
            reservedAmount,
            riskPercent,
            executionSource: 'SIMULATED_LIMIT',
            strategy: normalizedStrategy,
            clientOrderId: clientOrderId || undefined,
          },
        ],
        session ? { session } : {}
      );

      return {
        order,
        user: updatedUser,
      };
    } catch (error) {
      if (!transactional) {
        await releaseReservedWalletBalanceAtomic({
          userId,
          asset: 'USDT',
          amount: reservedAmount,
        }).catch(() => {});
      }

      throw error;
    }
  });

  emitUserTradingEvent(userId, 'order_placed', {
    orderId: String(result.order._id),
    symbol: result.order.symbol,
    side: result.order.side,
    type: result.order.type,
    limitPrice: result.order.limitPrice,
    total: result.order.total,
  });
  await emitPortfolioUpdated(userId, { reason: 'ORDER_PLACED' });

  return {
    order: {
      id: result.order._id,
      symbol: result.order.symbol,
      side: result.order.side,
      type: result.order.type,
      quantity: result.order.quantity,
      price: result.order.price,
      limitPrice: result.order.limitPrice,
      total: result.order.total,
      status: result.order.status,
      stopLoss: result.order.stopLoss,
      takeProfit: result.order.takeProfit,
      riskPercent: result.order.riskPercent,
      strategy: result.order.strategy,
      createdAt: result.order.createdAt,
    },
    wallet: Object.fromEntries(result.user.wallet || []),
    reservedWallet: Object.fromEntries(result.user.reservedWallet || []),
  };
};

module.exports = { placeLimitOrder };
