const { sanitizeObject, REDACTED_VALUE } = require('./sanitize');
const assert = require('assert');

const testSanitize = () => {
  console.log('Running sanitizeObject tests...');

  // Test basic redaction
  const basic = {
    username: 'jules',
    password: 'secretpassword123',
    email: 'jules@example.com'
  };
  const sanitizedBasic = sanitizeObject(basic);
  assert.strictEqual(sanitizedBasic.password, REDACTED_VALUE);
  assert.strictEqual(sanitizedBasic.username, 'jules');
  console.log('✅ Basic redaction passed');

  // Test nested redaction
  const nested = {
    user: {
      details: {
        password: 'nestedpassword'
      },
      token: 'some-jwt-token'
    },
    publicInfo: 'visible'
  };
  const sanitizedNested = sanitizeObject(nested);
  assert.strictEqual(sanitizedNested.user.details.password, REDACTED_VALUE);
  assert.strictEqual(sanitizedNested.user.token, REDACTED_VALUE);
  assert.strictEqual(sanitizedNested.publicInfo, 'visible');
  console.log('✅ Nested redaction passed');

  // Test case insensitivity
  const caseInsensitive = {
    PASSword: 'mypass',
    RefreshToken: 'myrefresh',
    api_key: 'mykey'
  };
  const sanitizedCase = sanitizeObject(caseInsensitive);
  assert.strictEqual(sanitizedCase.PASSword, REDACTED_VALUE);
  assert.strictEqual(sanitizedCase.RefreshToken, REDACTED_VALUE);
  assert.strictEqual(sanitizedCase.api_key, REDACTED_VALUE);
  console.log('✅ Case insensitivity passed');

  // Test circular references
  const circular = { a: 1 };
  circular.self = circular;
  const sanitizedCircular = sanitizeObject(circular);
  assert.strictEqual(sanitizedCircular.a, 1);
  assert.strictEqual(sanitizedCircular.self, '[Circular]');
  console.log('✅ Circular reference handling passed');

  // Test arrays
  const withArray = {
    items: [
      { password: 'p1' },
      { password: 'p2', other: 'o2' }
    ]
  };
  const sanitizedArray = sanitizeObject(withArray);
  assert.strictEqual(sanitizedArray.items[0].password, REDACTED_VALUE);
  assert.strictEqual(sanitizedArray.items[1].password, REDACTED_VALUE);
  assert.strictEqual(sanitizedArray.items[1].other, 'o2');
  console.log('✅ Array handling passed');

  console.log('All tests passed! 🎉');
};

try {
  testSanitize();
} catch (error) {
  console.error('Test failed! ❌');
  console.error(error);
  process.exit(1);
}
