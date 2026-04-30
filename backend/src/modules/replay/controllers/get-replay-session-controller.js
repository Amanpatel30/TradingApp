const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getReplaySession } = require('../services/get-replay-session-service');

const getReplaySessionController = asyncHandler(async (req, res) => {
  const data = await getReplaySession(req.user._id, req.query || {});
  return ApiResponse.success(res, data, 'Replay session retrieved successfully');
});

module.exports = {
  getReplaySessionController,
};
