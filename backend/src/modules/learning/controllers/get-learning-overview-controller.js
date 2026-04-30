const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getLearningOverview } = require('../services/get-learning-overview-service');

const getLearningOverviewController = asyncHandler(async (req, res) => {
  const data = await getLearningOverview(req.user._id);
  return ApiResponse.success(res, data, 'Learning overview retrieved successfully');
});

module.exports = {
  getLearningOverviewController,
};
