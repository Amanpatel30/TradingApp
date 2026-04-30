const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { buildAuthUserPayload } = require('../services/build-auth-user-payload');

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = buildAuthUserPayload(req.user);

  return ApiResponse.success(res, { user }, 'User profile retrieved successfully');
});

module.exports = { getMe };
