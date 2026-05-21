const { authService } = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { BadRequestError } = require('../../../utils/custom-error');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // The role is hardcoded to 'user' to prevent privilege escalation.
  // Validation is handled by the registerSchema in the routes.
  const result = await authService.register({ name, email, password, role: 'user' });

  return ApiResponse.created(res, result, 'User registered successfully');
});

module.exports = { register };
