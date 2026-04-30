const Order = require('../../../schema/order.model');
const Position = require('../../../schema/position.model');
const { getPrice } = require('../../../state/market.state');

const getOpenOrders = async (userId) => {
  const [orders, positions] = await Promise.all([
    Order.find({
      user: userId,
      status: 'OPEN',
    })
      .sort({ createdAt: -1 })
      .lean(),
    Position.find({
      user: userId,
      status: 'OPEN',
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const pendingOrders = orders.map((order) => ({
    id: String(order._id),
    entityType: 'ORDER',
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    quantity: order.quantity,
    price: order.price,
    limitPrice: order.limitPrice || null,
    total: order.total,
    status: order.status,
    strategy: order.strategy || 'Unlabeled',
    stopLoss: order.stopLoss || null,
    takeProfit: order.takeProfit || null,
    reservedAmount: order.reservedAmount || 0,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  const openPositions = positions.map((position) => {
    const marketData = getPrice(position.symbol) || {};
    return {
      id: String(position._id),
      entityType: 'POSITION',
      symbol: position.symbol,
      side: position.side === 'LONG' ? 'BUY' : 'SELL',
      type: 'POSITION',
      quantity: position.quantity,
      price: position.entryPrice,
      limitPrice: null,
      total: position.initialMargin,
      status: position.status,
      strategy: position.strategy || 'Unlabeled',
      stopLoss: position.stopLoss || null,
      takeProfit: position.takeProfit || null,
      reservedAmount: position.initialMargin || 0,
      currentPrice: Number(marketData.price || position.entryPrice || 0),
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  });

  return [...openPositions, ...pendingOrders].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );
};

module.exports = {
  getOpenOrders,
};
