const Order = require('../../../schema/order.model');
const Position = require('../../../schema/position.model');
const { releaseReservedWalletBalanceAtomic } = require('./wallet-atomic-service');

const reconcileTradingState = async ({ olderThanMs = 0 } = {}) => {
  const query = { status: 'PROCESSING' };
  if (olderThanMs > 0) {
    query.updatedAt = {
      $lte: new Date(Date.now() - olderThanMs),
    };
  }

  const processingOrders = await Order.find(query).lean();

  for (const order of processingOrders) {
    const relatedPosition = await Position.findOne({ sourceOrder: order._id }).lean();

    if (relatedPosition) {
      await Order.updateOne(
        { _id: order._id, status: 'PROCESSING' },
        {
          $set: {
            status: 'FILLED',
          },
        }
      );
      continue;
    }

    await releaseReservedWalletBalanceAtomic({
      userId: order.user,
      asset: order.reservedAsset || 'USDT',
      amount: Number(order.reservedAmount || order.total || 0),
    }).catch(() => {});

    await Order.updateOne(
      { _id: order._id, status: 'PROCESSING' },
      {
        $set: {
          status: 'CANCELLED',
          exitReason: 'RECOVERED_INCOMPLETE_ORDER',
        },
      }
    );
  }
};

const startProcessingRecoveryLoop = ({ intervalMs = 10000, olderThanMs = 5000 } = {}) => {
  return setInterval(() => {
    reconcileTradingState({ olderThanMs }).catch((error) => {
      console.error('Processing recovery loop failed:', error.message);
    });
  }, intervalMs);
};

module.exports = {
  reconcileTradingState,
  startProcessingRecoveryLoop,
};
