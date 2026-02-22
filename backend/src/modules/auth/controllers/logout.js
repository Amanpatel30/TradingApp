const { authService } = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await authService.logout(userId);

  return ApiResponse.success(res, result, 'Logged out successfully');
});

module.exports = { logout };
