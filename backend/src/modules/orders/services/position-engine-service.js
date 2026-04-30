const Order = require('../../../schema/order.model');
const Position = require('../../../schema/position.model');
const {
  rebuildUserPortfolioSnapshots,
} = require('../../dashboard/services/snapshot-service');
const {
  getMarketQuote,
  estimateExecutionPrice,
  round,
} = require('./trading-engine-utils');
const {
  applyPositionSettlementAtomic,
  rollbackPositionSettlementAtomic,
} = require('./wallet-atomic-service');
const { runWithMongoTransaction } = require('./mongo-transaction-service');
const {
  claimPositionClose,
  releasePositionClose,
} = require('./matching-runtime-service');
const { emitPortfolioUpdated, emitUserTradingEvent } = require('./trading-realtime-service');

const buildExitOrderPayload = ({
  position,
  side,
  executionPrice,
  total,
  realizedPnL,
  reason,
  spreadApplied,
  slippageApplied,
}) => ({
  user: position.user,
  symbol: position.symbol,
  side,
  type: 'MARKET',
  quantity: position.quantity,
  price: executionPrice,
  total,
  status: 'FILLED',
  realizedPnL,
  strategy: position.strategy || 'Unlabeled',
  stopLoss: position.stopLoss,
  takeProfit: position.takeProfit,
  reservedAsset: 'USDT',
  reservedAmount: position.initialMargin,
  executionSource: reason,
  exitReason: reason,
  spreadApplied,
  slippageApplied,
});

const openPosition = async ({
  user,
  order,
  executionPrice,
  initialMargin,
  stopLoss,
  takeProfit,
  session = null,
}) => {
  const side = order.side === 'BUY' ? 'LONG' : 'SHORT';

  const [position] = await Position.create(
    [
      {
        user: user._id,
        symbol: order.symbol,
        side,
        quantity: order.quantity,
        entryPrice: executionPrice,
        initialMargin,
        stopLoss,
        takeProfit,
        leverage: 1,
        strategy: order.strategy || 'Unlabeled',
        sourceOrder: order._id,
        status: 'OPEN',
      },
    ],
    session ? { session } : {}
  );

  return position;
};

const closePositionWithPrice = async ({
  position,
  executionPrice,
  reason = 'MANUAL_CLOSE',
  executionMeta = {},
}) => {
  const quantity = Number(position.quantity || 0);
  const sideMultiplier = position.side === 'LONG' ? 1 : -1;
  const uncappedPnl = round(
    (Number(executionPrice || 0) - Number(position.entryPrice || 0)) * quantity * sideMultiplier,
    6
  );
  const cappedPnl = Math.max(uncappedPnl, -Number(position.initialMargin || 0));
  const normalizedPnl = round(cappedPnl, 6);
  const exitValue = round(Number(position.initialMargin || 0) + normalizedPnl, 6);
  const closingSide = position.side === 'LONG' ? 'SELL' : 'BUY';
  const now = new Date();
  const nextStatus =
    normalizedPnl <= -Number(position.initialMargin || 0) ? 'LIQUIDATED' : 'CLOSED';

  const result = await runWithMongoTransaction(async ({ session, transactional }) => {
    let claimedPosition = null;

    try {
      claimedPosition = await Position.findOneAndUpdate(
        {
          _id: position._id,
          status: 'OPEN',
        },
        {
          $set: {
            status: nextStatus,
            exitPrice: executionPrice,
            realizedPnL: normalizedPnl,
            exitReason: reason,
            closedAt: now,
          },
        },
        {
          new: true,
          ...(session ? { session } : {}),
        }
      );

      if (!claimedPosition) {
        return null;
      }

      const updatedUser = await applyPositionSettlementAtomic({
        userId: position.user,
        asset: 'USDT',
        reservedAmount: Number(position.initialMargin || 0),
        realizedPnL: normalizedPnl,
        session,
      });

      const [exitOrder] = await Order.create(
        [
          buildExitOrderPayload({
            position: claimedPosition,
            side: closingSide,
            executionPrice,
            total: exitValue,
            realizedPnL: normalizedPnl,
            reason,
            spreadApplied: executionMeta.spreadApplied || 0,
            slippageApplied: executionMeta.slippageApplied || 0,
          }),
        ],
        session ? { session } : {}
      );

      return {
        position: claimedPosition,
        exitOrder,
        pnl: normalizedPnl,
        user: updatedUser,
      };
    } catch (error) {
      if (!transactional && claimedPosition?._id) {
        await rollbackPositionSettlementAtomic({
          userId: position.user,
          asset: 'USDT',
          reservedAmount: Number(position.initialMargin || 0),
          realizedPnL: normalizedPnl,
        }).catch(() => {});

        await Position.findByIdAndUpdate(claimedPosition._id, {
          status: 'OPEN',
          exitPrice: null,
          realizedPnL: 0,
          exitReason: '',
          closedAt: null,
        }).catch(() => {});
      }

      throw error;
    }
  });

  if (!result) {
    return null;
  }

  await rebuildUserPortfolioSnapshots(position.user);
  emitUserTradingEvent(position.user, 'position_closed', {
    positionId: String(result.position._id),
    symbol: result.position.symbol,
    side: result.position.side,
    exitReason: result.position.exitReason,
    realizedPnL: result.pnl,
  });
  await emitPortfolioUpdated(position.user, { reason: 'POSITION_CLOSED' });
  return result;
};

const closePositionAtMarket = async ({ position, reason = 'MANUAL_CLOSE' }) => {
  const quote = getMarketQuote(position.symbol);
  const closingSide = position.side === 'LONG' ? 'SELL' : 'BUY';
  const executionMeta = estimateExecutionPrice({
    quote,
    side: closingSide,
    kind: 'MARKET',
  });

  return closePositionWithPrice({
    position,
    executionPrice: executionMeta.executionPrice,
    reason,
    executionMeta,
  });
};

const checkAndCloseTriggeredPositions = async (symbol, currentPrice) => {
  const positions = await Position.find({
    symbol: String(symbol || '').toUpperCase(),
    status: 'OPEN',
  });

  if (!positions.length) {
    return;
  }

  for (const position of positions) {
    const markPrice = Number(currentPrice || 0);
    let shouldClose = false;
    let reason = '';

    if (position.side === 'LONG') {
      if (Number(position.takeProfit || 0) && markPrice >= Number(position.takeProfit)) {
        shouldClose = true;
        reason = 'TAKE_PROFIT';
      } else if (Number(position.stopLoss || 0) && markPrice <= Number(position.stopLoss)) {
        shouldClose = true;
        reason = 'STOP_LOSS';
      }
    } else if (position.side === 'SHORT') {
      if (Number(position.takeProfit || 0) && markPrice <= Number(position.takeProfit)) {
        shouldClose = true;
        reason = 'TAKE_PROFIT';
      } else if (Number(position.stopLoss || 0) && markPrice >= Number(position.stopLoss)) {
        shouldClose = true;
        reason = 'STOP_LOSS';
      }
    }

    if (!shouldClose) {
      continue;
    }

    if (!claimPositionClose(position._id)) {
      continue;
    }

    try {
      await closePositionAtMarket({ position, reason });
    } catch (error) {
      console.error(`Failed to close position ${position._id}:`, error.message);
    } finally {
      releasePositionClose(position._id);
    }
  }
};

module.exports = {
  openPosition,
  closePositionWithPrice,
  closePositionAtMarket,
  checkAndCloseTriggeredPositions,
};
