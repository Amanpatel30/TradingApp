/**
 * Utility to mask sensitive data in objects (e.g. for logging)
 * @param {Object} data - The object containing sensitive data
 * @param {Array<string>} fieldsToMask - List of fields to mask
 * @returns {Object} A new object with sensitive fields masked
 */
const maskSensitiveData = (data, fieldsToMask = ['password', 'token', 'refreshToken', 'accessToken']) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const maskedData = Array.isArray(data) ? [...data] : { ...data };

  for (const key in maskedData) {
    if (fieldsToMask.includes(key)) {
      maskedData[key] = '********';
    } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      maskedData[key] = maskSensitiveData(maskedData[key], fieldsToMask);
    }
  }

  return maskedData;
};

module.exports = {
  maskSensitiveData,
};
