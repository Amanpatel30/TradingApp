const Order = require('../../../schema/order.model');
const Position = require('../../../schema/position.model');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../../../utils/custom-error');
const {
  rebuildUserPortfolioSnapshots,
} = require('../../dashboard/services/snapshot-service');
const { releaseReservedWalletBalanceAtomic } = require('./wallet-atomic-service');
const { runWithMongoTransaction } = require('./mongo-transaction-service');
const { closePositionAtMarket } = require('./position-engine-service');
const { emitPortfolioUpdated, emitUserTradingEvent } = require('./trading-realtime-service');

const cancelOrder = async ({ userId, orderId }) => {
  if (!orderId) {
    throw new BadRequestError('Order ID is required');
  }

  const order = await Order.findById(orderId);

  if (order) {
    if (!order.user.equals(userId)) {
      throw new ForbiddenError('You are not authorized to cancel this order');
    }

    if (order.status !== 'OPEN') {
      throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
    }

    await runWithMongoTransaction(async ({ session, transactional }) => {
      let cancelledOrder = null;

      try {
        cancelledOrder = await Order.findOneAndUpdate(
          {
            _id: order._id,
            status: 'OPEN',
          },
          {
            $set: {
              status: 'CANCELLED',
              exitReason: 'USER_CANCELLED',
            },
          },
          {
            new: true,
            ...(session ? { session } : {}),
          }
        );

        if (!cancelledOrder) {
          throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
        }

        await releaseReservedWalletBalanceAtomic({
          userId,
          asset: order.reservedAsset || 'USDT',
          amount: Number(order.reservedAmount || order.total || 0),
          session,
        });
      } catch (error) {
        if (!transactional && cancelledOrder?._id) {
          await Order.findByIdAndUpdate(cancelledOrder._id, {
            status: 'OPEN',
            exitReason: '',
          }).catch(() => {});
        }

        throw error;
      }
    });

    await rebuildUserPortfolioSnapshots(userId);
    emitUserTradingEvent(userId, 'order_cancelled', {
      orderId: String(order._id),
      symbol: order.symbol,
      side: order.side,
      type: order.type,
    });
    await emitPortfolioUpdated(userId, { reason: 'ORDER_CANCELLED' });

    return {
      message: 'Order cancelled successfully',
      entityType: 'ORDER',
      order: {
        id: order._id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        status: order.status,
        limitPrice: order.limitPrice,
        quantity: order.quantity,
      },
    };
  }

  const position = await Position.findById(orderId);
  if (!position) {
    throw new NotFoundError('Order or position not found');
  }

  if (!position.user.equals(userId)) {
    throw new ForbiddenError('You are not authorized to close this position');
  }

  if (position.status !== 'OPEN') {
    throw new BadRequestError(`Cannot close position with status: ${position.status}`);
  }

  const result = await closePositionAtMarket({
    position,
    reason: 'MANUAL_CLOSE',
  });

  return {
    message: 'Position closed successfully',
    entityType: 'POSITION',
    order: {
      id: position._id,
      symbol: position.symbol,
      side: position.side,
      type: 'POSITION',
      status: result?.position?.status || 'CLOSED',
      quantity: position.quantity,
    },
  };
};

module.exports = { cancelOrder };
