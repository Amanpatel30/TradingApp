const { redact } = require('../src/utils/redact');
const assert = require('assert');

const testRedact = () => {
  console.log('Running redact utility tests...');

  // Test case 1: Basic redaction
  const data1 = { password: 'secretpassword', email: 'test@example.com' };
  const redacted1 = redact(data1);
  assert.strictEqual(redacted1.password, '[REDACTED]');
  assert.strictEqual(redacted1.email, 'test@example.com');
  console.log('Test case 1 passed: Basic redaction');

  // Test case 2: Nested redaction
  const data2 = {
    user: {
      password: 'mypassword',
      token: 'some-token'
    },
    info: 'public'
  };
  const redacted2 = redact(data2);
  assert.strictEqual(redacted2.user.password, '[REDACTED]');
  assert.strictEqual(redacted2.user.token, '[REDACTED]');
  assert.strictEqual(redacted2.info, 'public');
  console.log('Test case 2 passed: Nested redaction');

  // Test case 3: Array redaction
  const data3 = [
    { password: 'p1' },
    { password: 'p2', email: 'e2' }
  ];
  const redacted3 = redact(data3);
  assert.strictEqual(redacted3[0].password, '[REDACTED]');
  assert.strictEqual(redacted3[1].password, '[REDACTED]');
  assert.strictEqual(redacted3[1].email, 'e2');
  console.log('Test case 3 passed: Array redaction');

  // Test case 4: Custom fields
  const data4 = { secretKey: 'key123', publicField: 'data' };
  const redacted4 = redact(data4, ['secretKey']);
  assert.strictEqual(redacted4.secretKey, '[REDACTED]');
  assert.strictEqual(redacted4.publicField, 'data');
  console.log('Test case 4 passed: Custom fields');

  // Test case 5: Case insensitive
  const data5 = { PASSword: 'p123', Token: 't123' };
  const redacted5 = redact(data5);
  assert.strictEqual(redacted5.PASSword, '[REDACTED]');
  assert.strictEqual(redacted5.Token, '[REDACTED]');
  console.log('Test case 5 passed: Case insensitive');

  console.log('All redact utility tests passed!');
};

try {
  testRedact();
} catch (error) {
  console.error('Test failed:');
  console.error(error);
  process.exit(1);
}
