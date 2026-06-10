const { redact } = require('../src/utils/redact');
const assert = require('assert');

/**
 * Basic unit test for the redact utility
 */
const runTests = () => {
  const testData = {
    user: {
      name: 'John Doe',
      password: 'secretpassword123',
    },
    auth: {
      token: 'jwt-token-xyz',
    },
    config: {
      apiKey: 'api-key-123',
    }
  };

  const redacted = redact(testData);

  assert.strictEqual(redacted.user.password, '[REDACTED]');
  assert.strictEqual(redacted.auth.token, '[REDACTED]');
  assert.strictEqual(redacted.config.apiKey, '[REDACTED]');
  assert.strictEqual(redacted.user.name, 'John Doe');

  console.log('Redaction tests passed');
};

try {
  runTests();
} catch (error) {
  console.error('Redaction tests failed:', error.message);
  process.exit(1);
}
