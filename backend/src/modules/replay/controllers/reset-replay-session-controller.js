const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { resetReplaySession } = require('../services/reset-replay-session-service');

const resetReplaySessionController = asyncHandler(async (req, res) => {
  const data = await resetReplaySession(req.user._id, req.body || {});
  return ApiResponse.success(res, data, 'Replay session reset successfully');
});

module.exports = {
  resetReplaySessionController,
};
