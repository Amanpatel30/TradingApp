const passwordUtils = require('../../src/utils/password');

describe('password utils', () => {
  it('hashes passwords without storing the plain value', async () => {
    const hash = await passwordUtils.hashPassword('Demo@12345');

    expect(hash).not.toBe('Demo@12345');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('matches a valid password against its hash', async () => {
    const hash = await passwordUtils.hashPassword('Demo@12345');

    await expect(passwordUtils.comparePassword('Demo@12345', hash)).resolves.toBe(true);
  });

  it('rejects an invalid password against a valid hash', async () => {
    const hash = await passwordUtils.hashPassword('Demo@12345');

    await expect(passwordUtils.comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});
