const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getStrategies } = require('../services/get-strategies-service');

const getStrategiesController = asyncHandler(async (req, res) => {
  const data = await getStrategies(req.user._id);
  return ApiResponse.success(res, data, 'Strategies retrieved successfully');
});

module.exports = {
  getStrategiesController,
};
