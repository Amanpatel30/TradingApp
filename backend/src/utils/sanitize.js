const SENSITIVE_FIELDS = [
  'password', 'token', 'refreshToken', 'secret', 'apikey', 'api_key', 'access_token', 'authorization'
];

/**
 * Recursively redacts sensitive information from an object or array.
 */
const sanitizeObject = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return '[Circular]';

  if (Array.isArray(obj)) {
    seen.add(obj);
    return obj.map((item) => sanitizeObject(item, seen));
  }

  seen.add(obj);
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = (typeof value === 'object' && value !== null)
        ? sanitizeObject(value, seen) : value;
    }
  }
  return sanitized;
};

module.exports = { sanitizeObject };
