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
 * Recursively redacts sensitive fields from an object.
 * Handles nested objects and circular references.
 *
 * @param {Object} obj - The object to sanitize
 * @param {WeakSet} seen - Set to track visited objects (for circular references)
 * @returns {Object} The sanitized object
 */
const sanitizeObject = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references to prevent infinite loops (including arrays)
  if (seen.has(obj)) {
    return '[Circular]';
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, seen));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.includes(normalizedKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, seen);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = {
  sanitizeObject,
};
