const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getMarketOverview } = require('../services/get-market-overview-service');

const getMarketOverviewController = asyncHandler(async (req, res) => {
  const overview = await getMarketOverview({
    symbol: req.query.symbol,
    interval: req.query.interval,
    limit: req.query.limit,
  });

  return ApiResponse.success(
    res,
    overview,
    'Market overview retrieved successfully'
  );
});

module.exports = {
  getMarketOverviewController,
};
