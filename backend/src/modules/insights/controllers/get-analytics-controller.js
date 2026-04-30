const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getAnalytics } = require('../services/get-analytics-service');

const getAnalyticsController = asyncHandler(async (req, res) => {
  const data = await getAnalytics(req.user._id);
  return ApiResponse.success(res, data, 'Analytics retrieved successfully');
});

module.exports = {
  getAnalyticsController,
};
