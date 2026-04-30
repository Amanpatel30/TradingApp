const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { saveStrategy } = require('../services/save-strategy-service');

const createStrategyController = asyncHandler(async (req, res) => {
  const data = await saveStrategy(req.user._id, req.body || {});
  return ApiResponse.created(res, data, 'Strategy created successfully');
});

const updateStrategyController = asyncHandler(async (req, res) => {
  const data = await saveStrategy(req.user._id, req.body || {}, req.params.id);
  return ApiResponse.success(res, data, 'Strategy updated successfully');
});

module.exports = {
  createStrategyController,
  updateStrategyController,
};
