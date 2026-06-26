/**
 * Recursively redacts sensitive fields from an object.
 * @param {Object} obj - The object to sanitize.
 * @param {Array<string>} sensitiveFields - List of field names to redact.
 * @param {WeakSet} visited - Used to handle circular references.
 * @returns {Object} The sanitized object.
 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'access_token',
  'accessToken',
  'auth',
  'authorization',
];

const sanitizeObject = (
  obj,
  sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
  visited = new WeakSet()
) => {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Handle circular references
  if (visited.has(obj)) {
    return '[CIRCULAR]';
  }
  visited.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sensitiveFields, visited));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some((field) =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveFields, visited);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = { sanitizeObject };
