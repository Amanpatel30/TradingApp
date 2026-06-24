const DEFAULT_SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'api_key',
]);

const POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const REDACTED = '[REDACTED]';

const isPlainObjectLike = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const normalizeKey = (key) => String(key).toLowerCase();

const sanitizeObject = (input, options = {}) => {
  const sensitiveKeys = new Set(
    [...(options.sensitiveKeys || DEFAULT_SENSITIVE_KEYS)].map((key) => normalizeKey(key))
  );
  const seen = new WeakSet();

  const sanitizeValue = (value) => {
    if (Array.isArray(value)) {
      return value.map((entry) => sanitizeValue(entry));
    }

    if (!isPlainObjectLike(value)) {
      return value;
    }

    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);

    const sanitized = {};

    for (const [key, childValue] of Object.entries(value)) {
      if (POLLUTION_KEYS.has(key)) {
        continue;
      }

      sanitized[key] = sensitiveKeys.has(normalizeKey(key))
        ? REDACTED
        : sanitizeValue(childValue);
    }

    return sanitized;
  };

  return sanitizeValue(input);
};

module.exports = {
  DEFAULT_SENSITIVE_KEYS,
  REDACTED,
  sanitizeObject,
};
