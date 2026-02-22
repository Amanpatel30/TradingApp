const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { placeLimitOrder } = require('../services/place-limit-order-service');

// @desc    Place Limit Order
// @route   POST /api/orders/limit
// @access  Private
const createLimitOrder = asyncHandler(async (req, res) => {
  const { symbol, side, quantity, limitPrice } = req.body;

  const result = await placeLimitOrder({
    userId: req.user._id,
    symbol,
    side,
    quantity,
    limitPrice,
  });

  return ApiResponse.created(
    res,
    result,
    'Limit order placed successfully'
  );
});

module.exports = { createLimitOrder };
