/**
 * Redacts sensitive fields from an object recursively
 * @param {Object} obj - The object to redact
 * @param {Array<string>} sensitiveFields - List of field names to redact
 * @returns {Object} - The redacted object
 */
const redact = (obj, sensitiveFields = ['password', 'token', 'secret']) => {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, sensitiveFields));
  }

  const sensitiveFieldsLower = sensitiveFields.map(f => f.toLowerCase());

  const redactedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    if (sensitiveFieldsLower.some(field => keyLower.includes(field))) {
      redactedObj[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redactedObj[key] = redact(value, sensitiveFields);
    } else {
      redactedObj[key] = value;
    }
  }

  return redactedObj;
};

module.exports = redact;
