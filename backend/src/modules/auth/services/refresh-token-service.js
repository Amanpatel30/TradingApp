const User = require('../../../schema/user.model');
const jwtUtils = require('../../../lib/jwt');

const refreshToken = async (oldRefreshToken) => {
  // Verify refresh token
  const decoded = jwtUtils.verifyRefreshToken(oldRefreshToken);

  // Find user with refresh token
  const user = await User.findOne({ 
    _id: decoded.id, 
    refreshToken: oldRefreshToken 
  }).select('+refreshToken');

  if (!user) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  // Generate new tokens
  const payload = { id: user._id, email: user.email, role: user.role };
  const { accessToken, refreshToken: newRefreshToken } = jwtUtils.generateTokens(payload);

  // Update refresh token in database
  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

module.exports = { refreshToken };
