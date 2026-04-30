const User = require('../../../schema/user.model');
const jwtUtils = require('../../../lib/jwt');
const passwordUtils = require('../../../utils/password');
const authLogger = require('../auth-logger');
const { ConflictError } = require('../../../utils/custom-error');
const {
  rebuildUserPortfolioSnapshots,
} = require('../../dashboard/services/snapshot-service');
const { buildAuthUserPayload } = require('./build-auth-user-payload');

const register = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    authLogger.warn(`Registration attempt with existing email: ${userData.email}`);
    throw new ConflictError('User already exists with this email');
  }

  // Hash password
  const hashedPassword = await passwordUtils.hashPassword(userData.password);

  // Create user with hashed password
  const user = await User.create({
    ...userData,
    password: hashedPassword,
  });

  await rebuildUserPortfolioSnapshots(user._id);

  authLogger.info(`New user registered: ${user.email}`);

  // console.log(user)
  // Generate tokens
  const payload = { id: user._id, email: user.email, role: user.role };
  const { accessToken, refreshToken } = jwtUtils.generateTokens(payload);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: buildAuthUserPayload(user),
    accessToken,
    refreshToken,
  };
};

module.exports = { register };
