/**
 * Recursively masks sensitive fields in an object or array.
 * Useful for logging request bodies without exposing secrets.
 *
 * @param {any} data - The data to mask.
 * @returns {any} - The masked data.
 */
const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];
  const masked = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
};

module.exports = {
  maskSensitiveData,
};
