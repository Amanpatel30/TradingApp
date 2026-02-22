const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = req.user.toObject();

  // Convert wallet Map to plain object for safe JSON serialization
  if (req.user.wallet instanceof Map) {
    user.wallet = Object.fromEntries(req.user.wallet);
  }

  return ApiResponse.success(res, { user }, 'User profile retrieved successfully');
});

module.exports = { getMe };
