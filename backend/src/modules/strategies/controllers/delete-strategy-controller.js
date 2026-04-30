const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { deleteStrategy } = require('../services/delete-strategy-service');

const deleteStrategyController = asyncHandler(async (req, res) => {
  await deleteStrategy(req.user._id, req.params.id);
  return ApiResponse.success(res, null, 'Strategy deleted successfully');
});

module.exports = {
  deleteStrategyController,
};
