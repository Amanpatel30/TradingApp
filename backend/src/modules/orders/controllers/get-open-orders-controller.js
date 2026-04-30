const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getOpenOrders } = require('../services/get-open-orders-service');

const getOpenOrdersController = asyncHandler(async (req, res) => {
  const orders = await getOpenOrders(req.user._id);

  return ApiResponse.success(
    res,
    { orders },
    'Open orders retrieved successfully'
  );
});

module.exports = {
  getOpenOrdersController,
};
