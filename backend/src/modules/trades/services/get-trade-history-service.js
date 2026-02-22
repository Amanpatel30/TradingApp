const Order = require('../../../schema/order.model');
const { NotFoundError } = require('../../../utils/custom-error');

const getTradeHistory = async ({ userId, page, limit, symbol }) => {
  const filter = {
    user: userId,
    status: { $in: ['FILLED', 'CANCELLED'] },
  };

  if (symbol) {
    filter.symbol = symbol;
  }

  const skip = (page - 1) * limit;

  const [orders, totalRecords] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  if (!orders.length) {
    throw new NotFoundError('No trade history available');
  }

  return {
    trades: orders.map((order) => ({
      tradeId: order._id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price,
      status: order.status,
      timestamp: order.createdAt,
    })),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    },
  };
};

module.exports = {
  getTradeHistory,
};
