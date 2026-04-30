const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { placeReplayTrade } = require('../services/place-replay-trade-service');

const placeReplayTradeController = asyncHandler(async (req, res) => {
  const data = await placeReplayTrade(req.user._id, req.body || {});
  return ApiResponse.success(res, data, 'Replay trade saved successfully');
});

module.exports = {
  placeReplayTradeController,
};
