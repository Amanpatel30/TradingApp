const jwtUtils = require('../lib/jwt');
const User = require('../schema/user.model');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No token provided');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwtUtils.verifyAccessToken(token);
    
    // Fetch full user data from database
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      return next(error);
    }

    if (user.status !== 'active') {
      const error = new Error('Account is inactive');
      error.statusCode = 403;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error) {
    error.statusCode = 401;
    error.message = 'Invalid or expired token';
    next(error);
  }
};

module.exports = authenticate;
