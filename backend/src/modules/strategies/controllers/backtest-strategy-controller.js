const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { runStrategyBacktest } = require('../services/backtest-strategy-service');

const backtestStrategyController = asyncHandler(async (req, res) => {
  const data = await runStrategyBacktest(req.user._id, req.body || {});
  return ApiResponse.success(res, data, 'Backtest completed successfully');
});

module.exports = {
  backtestStrategyController,
};
