const Order = require('../../../schema/order.model');
const User = require('../../../schema/user.model');
const { BadRequestError } = require('../../../utils/custom-error');
const { getPortfolio } = require('../../portfolio/services/get-portfolio-service');
const {
  rebuildUserPortfolioSnapshots,
} = require('../../dashboard/services/snapshot-service');
const {
  calculateRiskPercent,
  enforceRiskLimit,
  estimateExecutionPrice,
  getMarketQuote,
  normalizeStrategy,
  round,
  validateProtectiveLevels,
  waitForExecutionWindow,
} = require('./trading-engine-utils');
const { openPosition } = require('./position-engine-service');
const { reserveWalletBalanceAtomic, releaseReservedWalletBalanceAtomic } = require('./wallet-atomic-service');
const { runWithMongoTransaction } = require('./mongo-transaction-service');
const { emitPortfolioUpdated, emitUserTradingEvent } = require('./trading-realtime-service');

const placeMarketOrder = async ({
  userId,
  symbol,
  side,
  quantity,
  strategy,
  stopLoss,
  takeProfit,
  clientOrderId,
}) => {
  if (!symbol || !side || !quantity) {
    throw new BadRequestError('Please provide symbol, side, and quantity');
  }

  const upperSide = String(side || '').toUpperCase();
  if (!['BUY', 'SELL'].includes(upperSide)) {
    throw new BadRequestError('Side must be either BUY or SELL');
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new BadRequestError('Quantity must be a positive number');
  }

  await waitForExecutionWindow();

  const quote = getMarketQuote(symbol);
  const executionMeta = estimateExecutionPrice({
    quote,
    side: upperSide,
    kind: 'MARKET',
  });
  const executionPrice = executionMeta.executionPrice;

  const protectiveLevels = validateProtectiveLevels({
    side: upperSide,
    entryPrice: executionPrice,
    stopLoss,
    takeProfit,
  });

  const [user, portfolio] = await Promise.all([User.findById(userId), getPortfolio(userId)]);

  if (!user) {
    throw new BadRequestError('User not found');
  }

  const initialMargin = round(quantity * executionPrice, 6);
  const riskPercent = calculateRiskPercent({
    entryPrice: executionPrice,
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
      amount: initialMargin,
      session,
    });

    let order = null;

    try {
      [order] = await Order.create(
        [
          {
            user: userId,
            symbol: normalizedSymbol,
            side: upperSide,
            type: 'MARKET',
            quantity,
            price: executionPrice,
            total: initialMargin,
            status: 'PROCESSING',
            realizedPnL: 0,
            stopLoss: protectiveLevels.stopLoss,
            takeProfit: protectiveLevels.takeProfit,
            reservedAsset: 'USDT',
            reservedAmount: initialMargin,
            riskPercent,
            spreadApplied: executionMeta.spreadApplied,
            slippageApplied: executionMeta.slippageApplied,
            executionSource: 'SIMULATED_MARKET',
            strategy: normalizedStrategy,
            clientOrderId: clientOrderId || undefined,
          },
        ],
        session ? { session } : {}
      );

      const position = await openPosition({
        user: updatedUser,
        order,
        executionPrice,
        initialMargin,
        stopLoss: protectiveLevels.stopLoss,
        takeProfit: protectiveLevels.takeProfit,
        session,
      });

      order = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: 'PROCESSING',
        },
        {
          $set: {
            status: 'FILLED',
          },
        },
        {
          new: true,
          ...(session ? { session } : {}),
        }
      );

      return {
        order,
        position,
        user: updatedUser,
      };
    } catch (error) {
      if (!transactional) {
        if (order?._id) {
          await Order.findByIdAndUpdate(order._id, {
            status: 'CANCELLED',
            exitReason: 'ORDER_CREATION_FAILED',
          });
        }

        await releaseReservedWalletBalanceAtomic({
          userId,
          asset: 'USDT',
          amount: initialMargin,
        }).catch(() => {});
      }

      throw error;
    }
  });

  await rebuildUserPortfolioSnapshots(userId);
  emitUserTradingEvent(userId, 'order_filled', {
    orderId: String(result.order._id),
    symbol: result.order.symbol,
    side: result.order.side,
    type: result.order.type,
    price: result.order.price,
    total: result.order.total,
    positionId: String(result.position._id),
  });
  await emitPortfolioUpdated(userId, { reason: 'ORDER_FILLED' });

  return {
    order: {
      id: result.order._id,
      symbol: result.order.symbol,
      side: result.order.side,
      type: result.order.type,
      quantity: result.order.quantity,
      price: result.order.price,
      total: result.order.total,
      status: result.order.status,
      realizedPnL: result.order.realizedPnL,
      strategy: result.order.strategy,
      stopLoss: result.order.stopLoss,
      takeProfit: result.order.takeProfit,
      riskPercent: result.order.riskPercent,
      createdAt: result.order.createdAt,
    },
    position: {
      id: result.position._id,
      side: result.position.side,
      quantity: result.position.quantity,
      entryPrice: result.position.entryPrice,
      stopLoss: result.position.stopLoss,
      takeProfit: result.position.takeProfit,
      initialMargin: result.position.initialMargin,
      strategy: result.position.strategy,
      status: result.position.status,
    },
    wallet: Object.fromEntries(result.user.wallet || []),
    reservedWallet: Object.fromEntries(result.user.reservedWallet || []),
  };
};

module.exports = { placeMarketOrder };
