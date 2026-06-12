const redact = require('./redact');
const assert = require('assert');

const testRedact = () => {
  console.log('Running redact unit tests...');

  // Test case 1: Basic redaction
  const obj1 = {
    username: 'jules',
    password: 'secretpassword123',
    email: 'jules@example.com'
  };
  const redacted1 = redact(obj1);
  assert.strictEqual(redacted1.username, 'jules');
  assert.strictEqual(redacted1.password, '[REDACTED]');
  assert.strictEqual(redacted1.email, 'jules@example.com');
  console.log('✅ Basic redaction passed');

  // Test case 2: Recursive redaction
  const obj2 = {
    user: {
      name: 'jules',
      auth: {
        token: 'sensitive-token-value',
        secretKey: 'very-secret'
      }
    }
  };
  const redacted2 = redact(obj2);
  assert.strictEqual(redacted2.user.name, 'jules');
  assert.strictEqual(redacted2.user.auth.token, '[REDACTED]');
  assert.strictEqual(redacted2.user.auth.secretKey, '[REDACTED]');
  console.log('✅ Recursive redaction passed');

  // Test case 3: Array redaction
  const obj3 = {
    users: [
      { name: 'alice', password: 'p1' },
      { name: 'bob', token: 't1' }
    ]
  };
  const redacted3 = redact(obj3);
  assert.strictEqual(redacted3.users[0].password, '[REDACTED]');
  assert.strictEqual(redacted3.users[1].token, '[REDACTED]');
  console.log('✅ Array redaction passed');

  // Test case 4: Custom sensitive fields
  const obj4 = {
    apiKey: 'my-key',
    normal: 'value'
  };
  const redacted4 = redact(obj4, ['apiKey']);
  assert.strictEqual(redacted4.apiKey, '[REDACTED]');
  assert.strictEqual(redacted4.normal, 'value');
  console.log('✅ Custom sensitive fields passed');

  // Test case 5: Case insensitivity
  const obj5 = {
    PASSWORD: 'p1',
    Token: 't1'
  };
  const redacted5 = redact(obj5);
  assert.strictEqual(redacted5.PASSWORD, '[REDACTED]');
  assert.strictEqual(redacted5.Token, '[REDACTED]');
  console.log('✅ Case insensitivity passed');

  console.log('All redact unit tests passed! 🎉');
};

try {
  testRedact();
} catch (error) {
  console.error('❌ Redact unit tests failed:');
  console.error(error);
  process.exit(1);
}
