const User = require('../../../schema/user.model');
const jwtUtils = require('../../../lib/jwt');
const { UnauthorizedError } = require('../../../utils/custom-error');

const refreshToken = async (oldRefreshToken) => {
  let decoded;

  try {
    decoded = jwtUtils.verifyRefreshToken(oldRefreshToken);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await User.findOne({
    _id: decoded.id,
    refreshToken: oldRefreshToken,
  }).select('+refreshToken');

  if (!user) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const payload = { id: user._id, email: user.email, role: user.role };
  const { accessToken, refreshToken: newRefreshToken } = jwtUtils.generateTokens(payload);

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

module.exports = { refreshToken };
