const { authService } = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { BadRequestError } = require('../../../utils/custom-error');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  // ✅ SECURITY: Only extract allowed fields from request body to prevent mass assignment
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError('Please provide name, email, and password');
  }

  // ✅ SECURITY: Explicitly set role to 'user' to prevent privilege escalation
  // Clients should never be able to register as an admin directly
  const result = await authService.register({
    name,
    email,
    password,
    role: 'user'
  });

  return ApiResponse.created(res, result, 'User registered successfully');
});

module.exports = { register };
