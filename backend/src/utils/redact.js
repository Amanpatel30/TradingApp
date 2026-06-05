/**
 * Sensitive fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'authorization',
  'apiKey',
  'cookie',
];

/**
 * Recursively redacts sensitive fields from an object
 * @param {any} data - The data to redact
 * @returns {any} - The redacted data
 */
const redact = (data, seen = new WeakSet()) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle circular references
  if (seen.has(data)) {
    return '[Circular]';
  }
  seen.add(data);

  if (Array.isArray(data)) {
    return data.map(item => redact(item, seen));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(data)) {
    // Exact match or ends with sensitive field name (e.g. access_token)
    const isSensitive = SENSITIVE_FIELDS.some(field => {
      const lowerKey = key.toLowerCase();
      const lowerField = field.toLowerCase();
      return lowerKey === lowerField || lowerKey.endsWith('_' + lowerField) || lowerKey.endsWith(field);
    });

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redact(value, seen);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
};

module.exports = redact;
