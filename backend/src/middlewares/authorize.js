const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Forbidden: Access denied');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = authorize;
