/**
 * Redaction utility for sensitive data
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie'
];

/**
 * Recursively redacts sensitive information from an object
 * @param {any} data - The data to redact
 * @returns {any} - The redacted data
 */
const redact = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redact);
  }

  if (typeof data === 'object') {
    const redacted = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redact(value);
      }
    }
    return redacted;
  }

  return data;
};

module.exports = { redact };
