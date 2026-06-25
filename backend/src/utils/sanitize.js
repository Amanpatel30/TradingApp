/**
 * Recursively sanitizes an object by redacting sensitive fields.
 * @param {Object} obj - The object to sanitize.
 * @param {Array<string>} sensitiveFields - List of field names to redact.
 * @returns {Object} The sanitized object.
 */
const sanitizeObject = (obj, sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey', 'access_token']) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sensitiveFields));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = { sanitizeObject };
