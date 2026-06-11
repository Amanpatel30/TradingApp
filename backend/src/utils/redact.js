/**
 * Redacts sensitive fields from an object recursively.
 *
 * @param {Object} data - The object to redact sensitive fields from.
 * @param {Array<string>} [fieldsToRedact=['password', 'token', 'secret']] - List of field names to redact.
 * @returns {Object} A new object with sensitive fields redacted.
 */
const redact = (data, fieldsToRedact = ['password', 'token', 'secret']) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redact(item, fieldsToRedact));
  }

  const redacted = {};

  for (const [key, value] of Object.entries(data)) {
    if (fieldsToRedact.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      redacted[key] = redact(value, fieldsToRedact);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
};

module.exports = { redact };
