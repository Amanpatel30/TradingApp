/**
 * Redacts sensitive information from an object.
 * Useful for logging request bodies or other data that might contain secrets.
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'api_key',
  'access_token',
  'authorization',
];

const REDACTED_VALUE = '[REDACTED]';

/**
 * Recursively sanitizes an object by redacting sensitive fields.
 * Handles circular references using a WeakSet.
 *
 * @param {any} obj - The object or value to sanitize
 * @param {WeakSet} seen - For internal use to track seen objects
 * @returns {any} The sanitized object or value
 */
const sanitizeObject = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
  if (seen.has(obj)) {
    return '[Circular]';
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    seen.add(obj);
    return obj.map(item => sanitizeObject(item, seen));
  }

  seen.add(obj);
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = REDACTED_VALUE;
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
  SENSITIVE_FIELDS,
  REDACTED_VALUE,
};
