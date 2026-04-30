const Order = require('../../../schema/order.model');

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

  return {
    trades: orders.map((order) => ({
      tradeId: order._id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      limitPrice: order.limitPrice || null,
      total: order.total,
      status: order.status,
      realizedPnL: order.realizedPnL || 0,
      strategy: order.strategy || 'Unlabeled',
      timestamp: order.createdAt,
    })),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: totalRecords ? Math.ceil(totalRecords / limit) : 0,
    },
  };
};

module.exports = {
  getTradeHistory,
};
