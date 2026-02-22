const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const {
  getTradeHistory,
} = require('../services/get-trade-history-service');

// @desc    Get authenticated user's trade history
// @route   GET /api/v1/trades/history
// @access  Private
const getTradeHistoryController = asyncHandler(async (req, res) => {
  const { page, limit, symbol } = req.query;
  const userId = req.user._id;

  const history = await getTradeHistory({
    userId,
    page,
    limit,
    symbol,
  });

  return ApiResponse.success(
    res,
    history,
    'Trade history retrieved successfully'
  );
});

module.exports = {
  getTradeHistoryController,
};
