const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'secret',
  'apikey',
  'api_key',
  'access_token',
  'authorization',
  'cookie',
  'set-cookie',
];

/**
 * Recursively sanitizes an object by redacting sensitive fields.
 * Handles circular references and arrays.
 *
 * @param {any} obj - The object or value to sanitize
 * @param {WeakSet} seen - Set of seen objects to handle circular references
 * @returns {any} Sanitized value
 */
const sanitizeObject = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
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

      // Robust check for sensitive fields, including hyphenated variants
      const isSensitive = SENSITIVE_FIELDS.some(field => {
        const normalizedField = field.replace(/[-_]/g, '');
        const normalizedKey = lowerKey.replace(/[-_]/g, '');
        return normalizedKey.includes(normalizedField);
      });

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(obj[key], seen);
      }
    }
  }

  return sanitized;
};

module.exports = {
  sanitizeObject,
  SENSITIVE_FIELDS,
};
