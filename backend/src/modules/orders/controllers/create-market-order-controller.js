const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { placeMarketOrder } = require('../services/place-market-order-service');

// @desc    Place Market Order
// @route   POST /api/orders/market
// @access  Private
const createMarketOrder = asyncHandler(async (req, res) => {
  const { symbol, side, quantity } = req.body;

  const order = await placeMarketOrder({
    userId: req.user._id,
    symbol,
    side,
    quantity,
  });

  return ApiResponse.created(
    res,
    order,
    'Market order executed successfully'
  );
});

module.exports = { createMarketOrder };
