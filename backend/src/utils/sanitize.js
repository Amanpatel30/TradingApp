const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'secret',
  'apikey',
  'api_key',
  'access_token',
  'authorization',
];

/**
 * Recursively redacts sensitive fields from an object or array
 * @param {any} obj - The object or array to sanitize
 * @param {WeakSet} seen - To handle circular references
 * @returns {any} - The sanitized object or array
 */
const sanitizeObject = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (seen.has(obj)) {
    return '[Circular]';
  }

  if (Array.isArray(obj)) {
    seen.add(obj);
    return obj.map((item) => sanitizeObject(item, seen));
  }

  seen.add(obj);
  const sanitized = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(obj[key], seen);
      }
    }
  }

  return sanitized;
};

module.exports = { sanitizeObject };
