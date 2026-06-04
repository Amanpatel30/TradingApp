const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'secret',
  'access_token',
  'refresh_token',
  'apiKey',
  'api_key',
  'authorization'
];

/**
 * Redacts sensitive information from an object.
 * @param {any} data - The data to redact.
 * @returns {any} - The redacted data.
 */
const redact = (data) => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redact);
  }

  const redacted = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redact(value);
    }
  }

  return redacted;
};

module.exports = redact;
