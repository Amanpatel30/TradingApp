const { z } = require('zod');
const ApiResponse = require('../utils/response');

const validateRequest = (schema) => async (req, res, next) => {
  try {
    const data = await schema.parseAsync(req.body);
    req.body = data; // Assign parsed/sanitized data back to req.body
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || error.errors || [];
      const errorMessages = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return ApiResponse.validationError(res, 'Validation failed', errorMessages);
    }
    next(error);
  }
};

module.exports = validateRequest;
