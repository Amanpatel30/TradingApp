const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getMistakes } = require('../services/get-mistakes-service');

const getMistakesController = asyncHandler(async (req, res) => {
  const data = await getMistakes(req.user._id);
  return ApiResponse.success(res, data, 'Mistake analysis retrieved successfully');
});

module.exports = {
  getMistakesController,
};
