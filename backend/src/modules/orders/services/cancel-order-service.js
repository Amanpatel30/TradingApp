const Order = require('../../../schema/order.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../../utils/custom-error');

/**
 * Cancel an existing OPEN order.
 * 
 * @param {Object} params
 * @param {String} params.userId  - Authenticated user's _id
 * @param {String} params.orderId - Order to cancel
 * @returns {Object} Cancelled order
 */
const cancelOrder = async ({ userId, orderId }) => {
  if (!orderId) {
    throw new BadRequestError('Order ID is required');
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check ownership (assuming user ID is stored as ObjectId or String, standard comparison)

  if (!order.user.equals(userId)) {
    throw new ForbiddenError('You are not authorized to cancel this order');
  }


  if (order.status !== 'OPEN') {
    throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
  }

  // Update status
  order.status = 'CANCELLED';
  await order.save();

  return {
    message: 'Order cancelled successfully',
    order: {
      id: order._id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      status: order.status,
      limitPrice: order.limitPrice,
      quantity: order.quantity,
    }
  };
};

module.exports = { cancelOrder };
