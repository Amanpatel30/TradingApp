const { cancelOrder } = require('../services/cancel-order-service');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');

// @desc    Cancel an open order
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private
const cancelOrderController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const result = await cancelOrder({ userId, orderId: id });

  return ApiResponse.success(res, result, 'Order cancelled successfully');
});

module.exports = { cancelOrderController };
