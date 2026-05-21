/**
 * Masks sensitive fields in an object or array.
 * @param {any} data - The data to mask.
 * @param {string[]} sensitiveFields - List of fields to mask.
 * @returns {any} - The data with sensitive fields masked.
 */
const maskSensitiveData = (data, sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey']) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item, sensitiveFields));
  }

  const masked = { ...data };

  for (const key in masked) {
    if (sensitiveFields.includes(key)) {
      masked[key] = '********';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key], sensitiveFields);
    }
  }

  return masked;
};

module.exports = {
  maskSensitiveData,
};
