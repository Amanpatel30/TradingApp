const { authService } = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { BadRequestError } = require('../../../utils/custom-error');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  // req.body is already validated and sanitized by registerSchema
  const result = await authService.register(req.body);

  return ApiResponse.created(res, result, 'User registered successfully');
});

module.exports = { register };
