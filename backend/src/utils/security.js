/**
 * Utility to mask sensitive data in objects/arrays for logging purposes.
 */
const maskSensitiveData = (data, sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey']) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item, sensitiveFields));
  }

  const maskedData = { ...data };

  for (const key in maskedData) {
    if (Object.prototype.hasOwnProperty.call(maskedData, key)) {
      if (sensitiveFields.includes(key)) {
        maskedData[key] = '********';
      } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
        maskedData[key] = maskSensitiveData(maskedData[key], sensitiveFields);
      }
    }
  }

  return maskedData;
};

module.exports = {
  maskSensitiveData,
};
