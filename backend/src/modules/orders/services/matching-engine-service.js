const Order = require('../../../schema/order.model');
const {
  rebuildUserPortfolioSnapshots,
} = require('../../dashboard/services/snapshot-service');
const {
  estimateExecutionPrice,
  getMarketQuote,
  round,
} = require('./trading-engine-utils');
const { adjustReservedWalletBalanceAtomic } = require('./wallet-atomic-service');
const { runWithMongoTransaction } = require('./mongo-transaction-service');
const {
  runMatchingForSymbol,
  registerLimitConfirmation,
  clearLimitConfirmation,
} = require('./matching-runtime-service');
const { emitPortfolioUpdated, emitUserTradingEvent } = require('./trading-realtime-service');
const {
  openPosition,
  checkAndCloseTriggeredPositions,
} = require('./position-engine-service');

const isReservationMismatchError = (error) =>
  /Unable to release reserved .* balance|Insufficient .* balance for reservation/i.test(
    String(error?.message || '')
  );

const cancelBrokenOpenOrder = async (order, reason) => {
  clearLimitConfirmation(order._id);
  await Order.updateOne(
    {
      _id: order._id,
      status: { $in: ['OPEN', 'PROCESSING'] },
    },
    {
      $set: {
        status: 'CANCELLED',
        exitReason: reason,
      },
    }
  );
};

const checkAndExecuteOrders = async (symbol, currentPrice, eventTime = Date.now()) => {
  await runMatchingForSymbol({
    symbol,
    currentPrice,
    eventTime,
    processTick: async ({ currentPrice: latestPrice }) => {
      const openOrders = await Order.find({
        symbol: String(symbol || '').toUpperCase(),
        status: 'OPEN',
        type: 'LIMIT',
      });

      if (!openOrders.length) {
        await checkAndCloseTriggeredPositions(symbol, latestPrice);
        return;
      }

      const normalizedCurrent = Number(Number(latestPrice || 0).toFixed(8));

      for (const order of openOrders) {
        try {
          await processOrder(order, normalizedCurrent);
        } catch (error) {
          if (isReservationMismatchError(error)) {
            await cancelBrokenOpenOrder(order, 'RESERVED_BALANCE_MISMATCH');
            console.warn(
              `Cancelled order ${order._id} after reserved-balance mismatch: ${error.message}`
            );
            continue;
          }

          console.error(`Failed to process order ${order._id}:`, error.message);
        }
      }

      await checkAndCloseTriggeredPositions(symbol, latestPrice);
    },
  });
};

const processOrder = async (order, currentPrice) => {
  const isBuy = order.side === 'BUY';
  const normalizedLimit = Number(Number(order.limitPrice || order.price || 0).toFixed(8));

  if (!normalizedLimit) {
    order.status = 'CANCELLED';
    order.exitReason = 'INVALID_LIMIT';
    await order.save();
    clearLimitConfirmation(order._id);
    return;
  }

  const shouldExecute =
    (isBuy && currentPrice <= normalizedLimit) ||
    (!isBuy && currentPrice >= normalizedLimit);

  if (!shouldExecute) {
    clearLimitConfirmation(order._id);
    return;
  }

  if (!registerLimitConfirmation(order._id, shouldExecute)) {
    return;
  }

  const quote = getMarketQuote(order.symbol);
  const executionMeta = estimateExecutionPrice({
    quote,
    side: order.side,
    kind: 'LIMIT',
    limitPrice: normalizedLimit,
  });
  const executionPrice = executionMeta.executionPrice;
  const actualMargin = round(Number(order.quantity || 0) * executionPrice, 6);
  const result = await runWithMongoTransaction(async ({ session, transactional }) => {
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: 'OPEN',
      },
      {
        $set: {
          status: 'PROCESSING',
        },
      },
      {
        new: true,
        ...(session ? { session } : {}),
      }
    );

    if (!claimedOrder) {
      return null;
    }

    try {
      const updatedUser = await adjustReservedWalletBalanceAtomic({
        userId: claimedOrder.user,
        asset: 'USDT',
        currentReserved: Number(claimedOrder.reservedAmount || claimedOrder.total || 0),
        targetReserved: actualMargin,
        session,
      });

      const position = await openPosition({
        user: updatedUser,
        order: claimedOrder,
        executionPrice,
        initialMargin: actualMargin,
        stopLoss: claimedOrder.stopLoss,
        takeProfit: claimedOrder.takeProfit,
        session,
      });

      const finalizedOrder = await Order.findOneAndUpdate(
        {
          _id: claimedOrder._id,
          status: 'PROCESSING',
        },
        {
          $set: {
            status: 'FILLED',
            price: executionPrice,
            total: actualMargin,
            reservedAmount: actualMargin,
            spreadApplied: executionMeta.spreadApplied,
            slippageApplied: executionMeta.slippageApplied,
            executionSource: 'SIMULATED_LIMIT_MATCH',
          },
        },
        {
          new: true,
          ...(session ? { session } : {}),
        }
      );

      return {
        order: finalizedOrder,
        position,
      };
    } catch (error) {
      if (!transactional) {
        await adjustReservedWalletBalanceAtomic({
          userId: claimedOrder.user,
          asset: 'USDT',
          currentReserved: actualMargin,
          targetReserved: Number(claimedOrder.reservedAmount || claimedOrder.total || 0),
        }).catch(() => {});
        await Order.findByIdAndUpdate(claimedOrder._id, {
          status: 'OPEN',
          exitReason: '',
        }).catch(() => {});
      }
      throw error;
    }
  });

  if (result?.order?._id) {
    clearLimitConfirmation(order._id);
    await rebuildUserPortfolioSnapshots(order.user);
    emitUserTradingEvent(order.user, 'order_filled', {
      orderId: String(result.order._id),
      symbol: result.order.symbol,
      side: result.order.side,
      type: result.order.type,
      price: result.order.price,
      total: result.order.total,
      positionId: String(result.position._id),
    });
    await emitPortfolioUpdated(order.user, { reason: 'ORDER_FILLED' });
  }
};

module.exports = { checkAndExecuteOrders };
