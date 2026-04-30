const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getDashboardSummary } = require('../services/get-dashboard-summary-service');

const getDashboardSummaryController = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.user._id, {
    window: req.query.window,
  });

  return ApiResponse.success(
    res,
    summary,
    'Dashboard summary retrieved successfully'
  );
});

module.exports = {
  getDashboardSummaryController,
};
