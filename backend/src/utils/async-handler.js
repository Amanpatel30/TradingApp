/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 * 
 * Usage:
 * const asyncHandler = require('../utils/async-handler');
 * 
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

module.exports = asyncHandler;
