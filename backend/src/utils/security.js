/**
 * Redacts sensitive fields from an object to prevent data leakage in logs
 * @param {Object} data - The object to mask
 * @param {Array<string>} sensitiveFields - Fields to redact
 * @returns {Object} - Masked object
 */
const maskSensitiveData = (data, sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret']) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Clone to avoid mutating original object
  const maskedData = Array.isArray(data) ? [...data] : { ...data };

  for (const key in maskedData) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      maskedData[key] = '***REDACTED***';
    } else if (typeof maskedData[key] === 'object') {
      maskedData[key] = maskSensitiveData(maskedData[key], sensitiveFields);
    }
  }

  return maskedData;
};

module.exports = {
  maskSensitiveData,
};
