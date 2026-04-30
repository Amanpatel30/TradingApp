const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getMarketTickers } = require('../services/get-market-tickers-service');

const getTickersController = asyncHandler(async (req, res) => {
  const tickers = await getMarketTickers();

  return ApiResponse.success(
    res,
    { tickers },
    'Market tickers retrieved successfully'
  );
});

module.exports = {
  getTickersController,
};
