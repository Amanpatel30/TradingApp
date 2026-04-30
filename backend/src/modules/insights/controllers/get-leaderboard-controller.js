const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getLeaderboard } = require('../services/get-leaderboard-service');

const getLeaderboardController = asyncHandler(async (req, res) => {
  const data = await getLeaderboard(req.user._id, {
    period: req.query.period,
    mode: req.query.mode,
  });
  return ApiResponse.success(res, data, 'Leaderboard retrieved successfully');
});

module.exports = {
  getLeaderboardController,
};
