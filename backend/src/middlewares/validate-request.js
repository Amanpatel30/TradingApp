const { z } = require('zod');
const ApiResponse = require('../utils/response');

const validateRequest = (schema, options = {}) => async (req, res, next) => {
  const normalizedOptions =
    typeof options === 'string' ? { source: options } : options;
  const source = normalizedOptions.source || 'body';
  const errorStatus = normalizedOptions.errorStatus || 422;

  try {
    const data = await schema.parseAsync(req[source]);
    req[source] = data; // Assign parsed/sanitized data back to req source
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || error.errors || [];
      const errorMessages = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      if (errorStatus === 422) {
        return ApiResponse.validationError(
          res,
          'Validation failed',
          errorMessages
        );
      }

      return ApiResponse.error(
        res,
        'Validation failed',
        errorStatus,
        errorMessages
      );
    }

    next(error);
  }
};

module.exports = validateRequest;
