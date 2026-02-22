const User = require('../../../schema/user.model');
const authLogger = require('../auth-logger');

const logout = async (userId) => {
  // Clear refresh token from database
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.refreshToken = null;
  await user.save();

  authLogger.info(`User logged out: ${user.email}`);

  return { message: 'Logged out successfully' };
};

module.exports = { logout };
