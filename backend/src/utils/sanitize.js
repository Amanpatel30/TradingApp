/**
 * Recursively sanitizes an object by redacting sensitive keys.
 *
 * @param {Object} obj - The object to sanitize
 * @param {Array<string>} sensitiveKeys - List of keys to redact
 * @returns {Object} - The sanitized object
 */
const sanitizeObject = (obj, sensitiveKeys = ['password', 'token', 'secret', 'refreshToken', 'accessToken', 'key']) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sensitiveKeys));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(sKey => key.toLowerCase().includes(sKey.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveKeys);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = { sanitizeObject };
